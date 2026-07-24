import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CreditCard, Sparkles, Users, TrendingUp } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";

export const Route = createFileRoute("/admin/subscriptions")({
  component: AdminSubscriptions,
});

const PLANS = [
  {
    name: "Família Essencial",
    price: "R$ 39,90/mês",
    features: [
      "1 criança + até 3 responsáveis",
      "Rotina, humor, medicação e timeline",
      "IA Azul (limite mensal)",
    ],
    color: "from-sky-500/10 to-cyan-500/10",
  },
  {
    name: "Família Plus",
    price: "R$ 79,90/mês",
    features: [
      "Até 3 crianças + responsáveis ilimitados",
      "Relatórios com IA e biblioteca de histórias",
      "Compartilhamento com escola e profissionais",
    ],
    color: "from-emerald-500/10 to-teal-500/10",
    highlight: true,
  },
  {
    name: "Profissional Clínica",
    price: "R$ 149,90/mês",
    features: [
      "Painel clínico completo",
      "Prontuário SOAP + evolução",
      "Escalas e relatórios em minutos",
    ],
    color: "from-indigo-500/10 to-violet-500/10",
  },
];

function AdminSubscriptions() {
  const { t } = useTranslation("admin");
  return (
    <AdminPage
      title={t("sidebar.subscriptions")}
      description="Catálogo de planos e visão geral de faturamento."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Assinaturas ativas", value: "—", icon: Users },
          { label: "MRR", value: "R$ —", icon: CreditCard },
          { label: "Churn 30d", value: "—%", icon: TrendingUp },
          { label: "Custo IA / usuário", value: "R$ —", icon: Sparkles },
        ].map((c) => {
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
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`relative rounded-2xl border border-border/60 bg-gradient-to-br ${p.color} p-5`}
          >
            {p.highlight && (
              <span className="absolute right-4 top-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                Mais escolhido
              </span>
            )}
            <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
            <p className="mt-1 text-2xl font-black text-foreground">{p.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-primary">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-6 rounded-xl border border-dashed border-border/60 bg-background p-4 text-sm text-muted-foreground">
        Integração de pagamento (Stripe) e ciclo de cobrança serão ativados na próxima onda.
      </p>
    </AdminPage>
  );
}
