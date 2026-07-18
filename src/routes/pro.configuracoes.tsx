import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ProPage, ProCard } from "@/components/pro/pro-page";

const SECTIONS = [
  "profile",
  "specialties",
  "availability",
  "integrations",
  "security",
] as const;

export const Route = createFileRoute("/pro/configuracoes")({
  component: ProSettingsPage,
});

function ProSettingsPage() {
  const { t } = useTranslation("pro");
  return (
    <ProPage title={t("settings.title")}>
      <div className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map((s) => (
          <ProCard key={s} title={t(`settings.sections.${s}`)}>
            <p className="text-xs text-muted-foreground">
              Configurações desta seção entram nas próximas ondas do módulo.
            </p>
          </ProCard>
        ))}
      </div>
    </ProPage>
  );
}
