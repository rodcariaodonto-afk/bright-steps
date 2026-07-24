import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Baby,
  Stethoscope,
  Home,
  Sparkles,
  Activity,
  Bell,
  CalendarCheck,
} from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { getAdminMetrics } from "@/modules/admin/api.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { t } = useTranslation("admin");
  const fetchMetrics = useServerFn(getAdminMetrics);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: () => fetchMetrics(),
  });

  const cards = [
    { key: "totalUsers", label: "Usuários totais", value: data?.totalUsers, icon: Users },
    { key: "newUsers7d", label: "Novos (7 dias)", value: data?.newUsers7d, icon: Activity },
    { key: "families", label: "Famílias", value: data?.families, icon: Home },
    { key: "children", label: "Crianças", value: data?.children, icon: Baby },
    { key: "professionals", label: "Profissionais", value: data?.professionals, icon: Stethoscope },
    { key: "sessions", label: "Sessões clínicas", value: data?.sessions, icon: CalendarCheck },
    { key: "notifications", label: "Notificações", value: data?.notifications, icon: Bell },
    { key: "lifetimeStars", label: "Estrelas conquistadas", value: data?.lifetimeStars, icon: Sparkles },
  ];

  return (
    <AdminPage title={t("dashboard.title")} description={t("dashboard.subtitle")}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.key}
              className="rounded-xl border border-border/60 bg-background p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </p>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {isLoading ? "…" : (c.value ?? 0).toLocaleString("pt-BR")}
              </p>
            </div>
          );
        })}
      </div>
    </AdminPage>
  );
}
