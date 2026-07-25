import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/atlas/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";

/**
 * Layout do módulo Família. Requer sessão ativa E assinatura vigente
 * (trial, active, past_due ou canceled com acesso até o fim do período).
 * Admins têm bypass. Sem assinatura => redireciona para /planos.
 */
export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });

    const userId = data.session.user.id;

    // Bypass para admin
    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    if (adminRow) return;

    if (!isPaymentsConfigured()) return;

    let env: "sandbox" | "live";
    try {
      env = getStripeEnvironment();
    } catch {
      return;
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const end = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : null;
    const future = end === null || end > Date.now();
    const active =
      !!sub &&
      ((["active", "trialing", "past_due"].includes(sub.status as string) && future) ||
        (sub.status === "canceled" && end !== null && end > Date.now()));

    if (!active) {
      throw redirect({ to: "/planos", search: { required: 1 } as never });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
