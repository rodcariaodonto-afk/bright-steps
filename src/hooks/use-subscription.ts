import { useEffect, useState, useCallback } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { findPlanByCode, type PlanCode } from "@/modules/billing/plans";

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
  isActive: boolean;
  isTrial: boolean;
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

  const planCode = subscription && findPlanByCode(subscription.product_id)?.code
    ? (subscription.product_id as PlanCode)
    : null;

  return {
    loading,
    subscription,
    planCode,
    isActive: isRowActive(subscription),
    isTrial: subscription?.status === "trialing",
    refresh: load,
  };
}
