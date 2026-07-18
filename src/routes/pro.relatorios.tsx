import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { FileText, Download } from "lucide-react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";

const TYPES = [
  "session",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
  "custom",
] as const;

export const Route = createFileRoute("/pro/relatorios")({
  component: ReportsPage,
});

function ReportsPage() {
  const { t } = useTranslation("pro");
  return (
    <ProPage title={t("reports.title")} subtitle={t("reports.subtitle")}>
      <ProCard title="Gerar novo relatório">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((k) => (
            <Button key={k} size="sm" variant="outline">
              <FileText className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t(`reports.types.${k}`)}
            </Button>
          ))}
        </div>
      </ProCard>
      <ProCard title="Biblioteca">
        <ul className="divide-y divide-border/60 text-sm">
          {["Relatório mensal — Miguel", "Sessão 12/06 — Bento", "Trimestral — Aurora"].map(
            (label) => (
              <li key={label} className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {label}
                </span>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost">
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="ml-1">PDF</span>
                  </Button>
                  <Button size="sm" variant="ghost">
                    DOCX
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      </ProCard>
    </ProPage>
  );
}
