import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Sparkles, Users, TrendingDown } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { getSubscriptionMetrics } from "@/modules/admin/api.functions";
import { PUBLIC_PLANS, formatBRL } from "@/modules/billing/plans";

export const Route = createFileRoute("/admin/subscriptions")({
  component: AdminSubscriptions,
});

function AdminSubscriptions() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "subscription-metrics"],
    queryFn: () => getSubscriptionMetrics(),
  });

  const activeCount = data?.active ?? 0;
  const trialing = data?.trialing ?? 0;
  const canceled30d = data?.canceled30d ?? 0;

  const mrr = PUBLIC_PLANS.reduce((sum, p) => {
    const m = data?.byPrice?.[p.price.monthly] ?? 0;
    const y = data?.byPrice?.[p.price.yearly] ?? 0;
    return sum + m * p.price.monthlyAmountBRL + y * Math.round(p.price.yearlyAmountBRL / 12);
  }, 0);

  const cards = [
    { label: "Assinaturas ativas", value: isLoading ? "…" : String(activeCount), icon: Users },
    { label: "MRR estimado", value: isLoading ? "…" : formatBRL(mrr), icon: CreditCard },
    { label: "Em trial", value: isLoading ? "…" : String(trialing), icon: Sparkles },
    { label: "Canceladas 30d", value: isLoading ? "…" : String(canceled30d), icon: TrendingDown },
  ];

  return (
    <AdminPage
      title="Assinaturas"
      description="Catálogo de planos, MRR estimado e distribuição real de assinantes."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-border/60 bg-background p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </p>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {PUBLIC_PLANS.map((p) => {
          const m = data?.byPrice?.[p.price.monthly] ?? 0;
          const y = data?.byPrice?.[p.price.yearly] ?? 0;
          return (
            <div
              key={p.code}
              className={`relative rounded-2xl border bg-background p-5 ${
                p.highlight ? "border-primary/60 ring-2 ring-primary/20" : "border-border/60"
              }`}
            >
              {p.highlight && (
                <span className="absolute right-4 top-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                  Mais escolhido
                </span>
              )}
              <h3 className="text-lg font-bold text-foreground">{p.displayName}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
                <div className="rounded-lg border border-border/60 bg-surface-2 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Mensal</p>
                  <p className="text-base font-bold text-foreground">{m}</p>
                  <p className="text-[11px] text-muted-foreground">{formatBRL(p.price.monthlyAmountBRL)}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-surface-2 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Anual</p>
                  <p className="text-base font-bold text-foreground">{y}</p>
                  <p className="text-[11px] text-muted-foreground">{formatBRL(p.price.yearlyAmountBRL)}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-primary">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </AdminPage>
  );
}
