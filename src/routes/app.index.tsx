import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Pill,
  CalendarDays,
  SmilePlus,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "morning" as const;
  if (h < 18) return "afternoon" as const;
  return "evening" as const;
}

function Dashboard() {
  const { t } = useTranslation("app");
  const greetingKey = getGreetingKey();

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          ATLAS
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">
          {t(`dashboard.greeting.${greetingKey}`)}, Ana.
        </h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard.welcome")}</p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Card
          icon={<CalendarDays className="h-5 w-5" />}
          title={t("dashboard.cards.nextEvent")}
          value="Terapia ocupacional"
          hint="Hoje, 16:00 · Dra. Marina"
          tone="primary"
        />
        <Card
          icon={<Pill className="h-5 w-5" />}
          title={t("dashboard.cards.medications")}
          value="2 pendentes"
          hint="12:30 · Metilfenidato · 10mg"
          tone="accent"
        />
        <Card
          icon={<SmilePlus className="h-5 w-5" />}
          title={t("dashboard.cards.mood")}
          value="Bem"
          hint="Registro de ontem"
        />

        <div className="rounded-3xl border border-primary/20 bg-primary-soft/70 p-6 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("dashboard.cards.aiSummary")}
              </p>
              <p className="font-display text-lg font-bold text-foreground">
                Semana calma, com boa evolução no sono
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/90">
            Nos últimos 7 dias o Bento dormiu em média 9h20 — 22% acima da
            semana anterior. Continue com a rotina noturna das 20h30. O humor
            oscilou nos dias sem terapia; considere combinar dias fixos.
          </p>
          <Button asChild variant="secondary" className="mt-4 rounded-full">
            <Link to="/app/ia">
              Conversar com o Atlas IA
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="rounded-3xl border border-dashed border-border p-6">
          <p className="text-sm font-semibold text-muted-foreground">
            Ativar dados reais
          </p>
          <p className="mt-2 text-sm text-foreground">
            {t("dashboard.empty")}
          </p>
        </div>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  value,
  hint,
  tone = "muted",
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  hint: string;
  tone?: "primary" | "accent" | "muted";
}) {
  const iconBg =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "accent"
        ? "bg-accent text-accent-foreground"
        : "bg-surface-2 text-foreground";
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>
      <p className="mt-4 font-display text-2xl font-bold text-foreground">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
