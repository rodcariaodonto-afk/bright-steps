import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Sparkles, Send, ShieldAlert } from "lucide-react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pro/ia")({
  component: ProAiPage,
});

function ProAiPage() {
  const { t } = useTranslation("pro");
  const suggestions = t("ai.suggestions", { returnObjects: true }) as string[];

  return (
    <ProPage title={t("ai.title")} subtitle={t("ai.subtitle")}>
      <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
        <ShieldAlert className="mt-0.5 h-4 w-4" aria-hidden="true" />
        {t("ai.disclaimer")}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <ProCard title="Sugestões" className="lg:col-span-1">
          <ul className="space-y-2 text-xs">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-border/60 px-2.5 py-2 text-left hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </ProCard>

        <div className="lg:col-span-3">
          <ProCard>
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-sm text-muted-foreground">
                Assistente clínico dedicado. Thread separada da IA da família,
                com contexto exclusivo dos seus pacientes.
              </p>
            </div>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="text"
                placeholder="Pergunte ao Atlas Clínico…"
                className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" size="sm" className="rounded-full">
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </form>
          </ProCard>
        </div>
      </div>
    </ProPage>
  );
}
