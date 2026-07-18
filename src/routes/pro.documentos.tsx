import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ProPage, ProCard } from "@/components/pro/pro-page";

const CATS = [
  "reports",
  "referrals",
  "prescriptions",
  "assessments",
  "exams",
  "photos",
  "videos",
  "pdf",
] as const;

export const Route = createFileRoute("/pro/documentos")({
  component: DocumentsPage,
});

function DocumentsPage() {
  const { t } = useTranslation("pro");
  return (
    <ProPage title={t("documents.title")} subtitle={t("documents.subtitle")}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATS.map((c) => (
          <ProCard key={c} title={t(`documents.categories.${c}`)}>
            <p className="text-xs text-muted-foreground">
              0 itens · versionamento habilitado
            </p>
          </ProCard>
        ))}
      </div>
    </ProPage>
  );
}
