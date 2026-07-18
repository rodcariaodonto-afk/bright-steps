import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { School as SchoolIcon, ShieldCheck } from "lucide-react";

import { ProPage, ProCard } from "@/components/pro/pro-page";

export const Route = createFileRoute("/pro/escola")({
  component: SchoolPage,
});

function SchoolPage() {
  const { t } = useTranslation("pro");
  return (
    <ProPage title={t("school.title")} subtitle={t("school.subtitle")}>
      <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4" aria-hidden="true" />
        {t("school.consentRequired")}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProCard title="Escolas vinculadas">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <SchoolIcon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Nenhuma escola vinculada
              </p>
              <p className="text-xs text-muted-foreground">
                O vínculo escola↔criança entra na Onda 4.
              </p>
            </div>
          </div>
        </ProCard>
        <ProCard title="Compartilhamentos ativos">
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Nenhum compartilhamento com escolas.
          </div>
        </ProCard>
      </div>
    </ProPage>
  );
}
