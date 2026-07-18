import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pro/escalas")({
  component: ScalesPage,
});

function ScalesPage() {
  const { t } = useTranslation("pro");
  return (
    <ProPage
      title={t("scales.title")}
      subtitle={t("scales.subtitle")}
      actions={
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t("scales.new")}
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ProCard title="Catálogo de instrumentos">
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Nenhuma escala cadastrada. Arquitetura aberta: cadastre qualquer
            instrumento (itens, pontuação, faixas) sem alterar código.
          </div>
        </ProCard>
        <ProCard title={t("scales.applications")}>
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Aplicações e comparativos entram na Onda 3.
          </div>
        </ProCard>
      </div>
    </ProPage>
  );
}
