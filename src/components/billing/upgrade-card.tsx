import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FEATURE_LABEL,
  FEATURE_MIN_PLAN,
  type Feature,
} from "@/modules/billing/entitlements";
import { findPlanByCode } from "@/modules/billing/plans";

interface UpgradeCardProps {
  feature: Feature;
  reason?: string;
}

export function UpgradeCard({ feature, reason }: UpgradeCardProps) {
  const minPlan = findPlanByCode(FEATURE_MIN_PLAN[feature]);
  const label = FEATURE_LABEL[feature];

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-3 w-3" /> Recurso do plano {minPlan?.displayName ?? "pago"}
        </p>
        <h2 className="mt-3 text-xl font-bold text-foreground">{label}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {reason ??
            `Para desbloquear "${label}", ative um plano com 7 dias grátis. Cancele quando quiser.`}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to="/planos">Ver planos</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/app/assinatura">Minha assinatura</Link>
        </Button>
      </div>
    </div>
  );
}
