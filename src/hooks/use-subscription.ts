import { useEffect, useState, useCallback, useMemo } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { findPlanByPriceId, type PlanCode } from "@/modules/billing/plans";
import {
  hasFeature as hasFeatureImpl,
  type EntitledPlan,
  type Feature,
} from "@/modules/billing/entitlements";

export interface SubscriptionRow {
  id: string;
  stripe_subscription_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
}

export interface SubscriptionState {
  loading: boolean;
  subscription: SubscriptionRow | null;
  planCode: PlanCode | null;
  /** Plano efetivo para gating; "free" quando não há assinatura ativa. */
  entitledPlan: EntitledPlan;
  isActive: boolean;
  isTrial: boolean;
  isPastDue: boolean;
  hasFeature: (feature: Feature) => boolean;
  refresh: () => Promise<void>;
}

function isRowActive(row: SubscriptionRow | null): boolean {
  if (!row) return false;
  const end = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  const future = end === null || end > Date.now();
  if (["active", "trialing", "past_due"].includes(row.status) && future) return true;
  if (row.status === "canceled" && end !== null && end > Date.now()) return true;
  return false;
}

export function useSubscription(userId: string | null | undefined): SubscriptionState {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId || !isPaymentsConfigured()) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    let env: string;
    try {
      env = getStripeEnvironment();
    } catch {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select(
        "id, stripe_subscription_id, product_id, price_id, status, current_period_end, cancel_at_period_end, trial_end",
      )
      .eq("user_id", userId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`subscriptions:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => {
          load();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  const isActive = isRowActive(subscription);

  // planCode: sempre derivado do price_id (lookup_key), que é estável entre
  // sandbox/live. Nunca do product_id (que guarda o `prod_xxx` interno).
  const planCode: PlanCode | null = useMemo(() => {
    if (!subscription) return null;
    return findPlanByPriceId(subscription.price_id)?.code ?? null;
  }, [subscription]);

  const entitledPlan: EntitledPlan = isActive && planCode ? planCode : "free";

  const hasFeature = useCallback(
    (feature: Feature) => hasFeatureImpl(entitledPlan, feature),
    [entitledPlan],
  );

  return {
    loading,
    subscription,
    planCode,
    entitledPlan,
    isActive,
    isTrial: subscription?.status === "trialing",
    isPastDue: subscription?.status === "past_due",
    hasFeature,
    refresh: load,
  };
}
