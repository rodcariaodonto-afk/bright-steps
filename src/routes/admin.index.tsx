import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Users,
  Baby,
  Stethoscope,
  Home,
  DollarSign,
  Sparkles,
  Activity,
  TrendingUp,
} from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const CARDS = [
  { key: "mau", value: "—", trend: "+0%", icon: Users },
  { key: "dau", value: "—", trend: "+0%", icon: Activity },
  { key: "families", value: "—", trend: "+0%", icon: Home },
  { key: "professionals", value: "—", trend: "+0%", icon: Stethoscope },
  { key: "children", value: "—", trend: "+0%", icon: Baby },
  { key: "revenue", value: "R$ —", trend: "+0%", icon: DollarSign },
  { key: "aiCost", value: "R$ —", trend: "+0%", icon: Sparkles },
  { key: "conversion", value: "—%", trend: "+0%", icon: TrendingUp },
];

function AdminDashboard() {
  const { t } = useTranslation("admin");
  return (
    <AdminPage title={t("dashboard.title")} description={t("dashboard.subtitle")}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.key}
              className="rounded-xl border border-border/60 bg-background p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(`dashboard.cards.${c.key}`)}
                </p>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{c.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{c.trend}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-border/60 bg-background p-6 text-sm text-muted-foreground">
        Os gráficos de MAU, DAU, retenção, churn, LTV, CAC, receita, uso da IA e ranking
        de conteúdo entram na Onda 5, quando o Cloud reativar e os eventos de{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">analytics_events</code>{" "}
        começarem a fluir.
      </div>
    </AdminPage>
  );
}
