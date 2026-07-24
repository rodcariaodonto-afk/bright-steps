import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { BillingEmbeddedCheckout } from "@/components/billing/embedded-checkout";
import { PaymentTestModeBanner } from "@/components/billing/payment-test-mode-banner";
import { supabase } from "@/integrations/supabase/client";
import { findPlanByPriceId } from "@/modules/billing/plans";

export const Route = createFileRoute("/planos_/checkout")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    priceId: typeof s.priceId === "string" ? s.priceId : "",
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth" });
    }
    if (!search.priceId || !findPlanByPriceId(search.priceId)) {
      throw redirect({ to: "/planos" });
    }
  },
  head: () => ({
    meta: [
      { title: "Checkout, Meu Mundo Azul" },
      { name: "description", content: "Finalize sua assinatura em ambiente seguro." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { priceId } = Route.useSearch();
  const plan = findPlanByPriceId(priceId);
  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/planos/obrigado?session_id={CHECKOUT_SESSION_ID}`
      : "/planos/obrigado";

  return (
    <div className="min-h-dvh bg-surface-2">
      <PaymentTestModeBanner />
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/planos" className="text-sm text-muted-foreground hover:text-foreground">
            &larr; Escolher outro plano
          </Link>
          <span className="text-sm font-medium text-foreground">
            {plan?.displayName}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <BillingEmbeddedCheckout priceId={priceId} returnUrl={returnUrl} />
      </main>
    </div>
  );
}
