import { Link } from "@tanstack/react-router";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";

import { useSession } from "@/hooks/use-session";
import { useSubscription } from "@/hooks/use-subscription";

/**
 * Faixa contextual mostrada no topo do AppShell:
 * - past_due  → alerta vermelho pedindo atualização de pagamento
 * - trialing  → contagem regressiva do trial
 * - free      → CTA discreto para ver planos
 */
export function SubscriptionBanner() {
  const { session } = useSession();
  const { subscription, isTrial, isPastDue, entitledPlan } = useSubscription(
    session?.user?.id,
  );

  if (!session) return null;

  if (isPastDue) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 border-b border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-900">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <span>
          Sua última cobrança falhou. Atualize o pagamento para não perder acesso.
        </span>
        <Link
          to="/app/assinatura"
          className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700"
        >
          Atualizar pagamento
        </Link>
      </div>
    );
  }

  if (isTrial && subscription?.trial_end) {
    const end = new Date(subscription.trial_end);
    const daysLeft = Math.max(
      0,
      Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span>
          Você está no período de teste. {daysLeft} dia{daysLeft === 1 ? "" : "s"} restantes.
        </span>
        <Link
          to="/app/assinatura"
          className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
        >
          Gerenciar
        </Link>
      </div>
    );
  }

  if (entitledPlan === "free") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 border-b border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span>
          Você está no plano gratuito. Desbloqueie IA, relatórios e mais com 7 dias grátis.
        </span>
        <Link
          to="/planos"
          className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:brightness-110"
        >
          Ver planos
        </Link>
      </div>
    );
  }

  return null;
}
