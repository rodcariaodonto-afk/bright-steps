import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useSubscription } from "@/hooks/use-subscription";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { createPortalSession } from "@/modules/billing/api.functions";
import { findPlanByCode, findPlanByPriceId, formatBRL } from "@/modules/billing/plans";

export const Route = createFileRoute("/app/assinatura")({
  head: () => ({
    meta: [
      { title: "Minha assinatura, Meu Mundo Azul" },
      { name: "description", content: "Gerencie seu plano, forma de pagamento e faturas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssinaturaPage,
});

function statusLabel(status: string): string {
  switch (status) {
    case "trialing":
      return "Em período de teste";
    case "active":
      return "Ativa";
    case "past_due":
      return "Pagamento pendente";
    case "canceled":
      return "Cancelada";
    case "incomplete":
      return "Aguardando pagamento";
    default:
      return status;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "active":
    case "trialing":
      return "bg-emerald-500/15 text-emerald-700";
    case "past_due":
    case "incomplete":
      return "bg-amber-500/15 text-amber-700";
    case "canceled":
      return "bg-rose-500/15 text-rose-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function AssinaturaPage() {
  const { session } = useSession();
  const { loading, subscription, refresh } = useSubscription(session?.user?.id);
  const [openingPortal, setOpeningPortal] = useState(false);

  const openPortal = async () => {
    if (!isPaymentsConfigured()) {
      toast.error("Pagamentos ainda não configurados em produção.");
      return;
    }
    setOpeningPortal(true);
    try {
      const res = await createPortalSession({
        data: {
          returnUrl: window.location.href,
          environment: getStripeEnvironment(),
        },
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      window.open(res.url, "_blank");
    } finally {
      setOpeningPortal(false);
    }
  };

  const plan = subscription
    ? findPlanByCode(subscription.product_id) ?? findPlanByPriceId(subscription.price_id)
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minha assinatura</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie plano, forma de pagamento e faturas.
        </p>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      ) : subscription && plan ? (
        <div className="rounded-2xl border border-border/60 bg-background p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{plan.displayName}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(subscription.status)}`}
            >
              {statusLabel(subscription.status)}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-surface-2 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Plano
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {subscription.price_id.endsWith("yearly")
                  ? `${formatBRL(plan.price.yearlyAmountBRL)} /ano`
                  : `${formatBRL(plan.price.monthlyAmountBRL)} /mês`}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-surface-2 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {subscription.cancel_at_period_end ? "Acesso até" : "Próxima cobrança"}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
                  : ","}
              </p>
            </div>
          </div>

          {subscription.cancel_at_period_end && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Sua assinatura foi cancelada e permanece ativa até o fim do período atual.
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={openPortal} disabled={openingPortal}>
              {openingPortal ? "Abrindo…" : "Gerenciar cobrança"}
              <ExternalLink className="ml-1 h-4 w-4" />
            </Button>
            <Button asChild variant="outline" onClick={() => refresh()}>
              <Link to="/planos">Trocar de plano</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-3 text-lg font-bold text-foreground">Você ainda não tem um plano ativo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Comece com 7 dias grátis em qualquer plano. Cancele quando quiser.
          </p>
          <Button asChild className="mt-4">
            <Link to="/planos">Ver planos</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
