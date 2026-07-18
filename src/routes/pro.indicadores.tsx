import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ProPage, ProCard } from "@/components/pro/pro-page";

const SERIES = [
  "evolution",
  "frequency",
  "participation",
  "goals",
  "mood",
  "behavior",
  "sleep",
  "medication",
] as const;

export const Route = createFileRoute("/pro/indicadores")({
  component: IndicatorsPage,
});

function IndicatorsPage() {
  const { t } = useTranslation("pro");
  return (
    <ProPage title={t("indicators.title")} subtitle={t("indicators.subtitle")}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SERIES.map((s) => (
          <ProCard key={s} title={t(`indicators.series.${s}`)}>
            <div className="flex h-24 items-end gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-primary/70"
                  style={{ height: `${20 + ((i * 37) % 70)}%` }}
                />
              ))}
            </div>
          </ProCard>
        ))}
      </div>
    </ProPage>
  );
}
