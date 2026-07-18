import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  HeartHandshake,
  CalendarDays,
  MessagesSquare,
  Shield,
  ArrowRight,
  BookOpenText,
  LineChart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AtlasLogo } from "@/components/atlas/atlas-logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Meu Mundo Azul — Plataforma para o desenvolvimento infantil e o neurodesenvolvimento",
      },
      {
        name: "description",
        content:
          "Organize rotina, terapias, humor e medicações. Uma IA acolhedora acompanha a jornada da sua criança do TEA ao TDAH, dislexia e além.",
      },
    ],
  }),
  component: Landing,
});

const pillarIcons = [HeartHandshake, Sparkles, MessagesSquare, LineChart];

function Landing() {
  const { t } = useTranslation(["landing", "common"]);
  const pillars = t("landing:pillars.items", { returnObjects: true }) as Array<{
    title: string;
    description: string;
  }>;
  const modules = t("landing:modules.items", { returnObjects: true }) as string[];
  const aiBullets = t("landing:ai.bullets", { returnObjects: true }) as string[];
  const securityItems = t("landing:security.items", {
    returnObjects: true,
  }) as string[];

  return (
    <div className="min-h-dvh bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container-atlas flex h-16 items-center justify-between">
          <Link to="/" aria-label="Meu Mundo Azul">
            <AtlasLogo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#pilares" className="hover:text-foreground">
              {t("common:nav.product")}
            </a>
            <a href="#modulos" className="hover:text-foreground">
              {t("common:nav.family")}
            </a>
            <a href="#ia" className="hover:text-foreground">
              {t("common:nav.ai")}
            </a>
            <a href="#seguranca" className="hover:text-foreground">
              {t("common:nav.security")}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">{t("common:actions.signIn")}</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/auth">{t("common:actions.getStarted")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-70"
            style={{
              background:
                "radial-gradient(60% 60% at 20% 10%, oklch(0.93 0.05 165) 0%, transparent 60%), radial-gradient(50% 50% at 90% 30%, oklch(0.95 0.05 40) 0%, transparent 60%)",
            }}
          />
          <div className="container-atlas grid gap-12 py-20 md:grid-cols-[1.15fr_1fr] md:py-28">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {t("landing:hero.eyebrow")}
              </p>
              <h1 className="mt-6 text-balance text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl">
                {t("landing:hero.title")}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t("landing:hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link to="/auth">
                    {t("landing:hero.primaryCta")}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full"
                >
                  <a href="#modulos">{t("landing:hero.secondaryCta")}</a>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                {t("landing:hero.trust")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <HeroPreview />
            </motion.div>
          </div>
        </section>

        {/* Pilares */}
        <section id="pilares" className="border-t border-border/60 bg-surface-2/60 py-24">
          <div className="container-atlas">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-bold tracking-tight text-foreground">
                {t("landing:pillars.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("landing:pillars.subtitle")}
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {pillars.map((pillar, idx) => {
                const Icon = pillarIcons[idx] ?? Sparkles;
                return (
                  <motion.div
                    key={pillar.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {pillar.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Módulos */}
        <section id="modulos" className="py-24">
          <div className="container-atlas grid gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-foreground">
                {t("landing:modules.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("landing:modules.subtitle")}
              </p>
              <Button asChild size="lg" className="mt-8 rounded-full">
                <Link to="/auth">{t("common:actions.getStarted")}</Link>
              </Button>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {modules.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4"
                >
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* IA */}
        <section
          id="ia"
          className="relative overflow-hidden border-y border-border/60 bg-primary-soft/60 py-24"
        >
          <div className="container-atlas grid gap-12 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {t("landing:ai.eyebrow")}
              </p>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-foreground">
                {t("landing:ai.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("landing:ai.description")}
              </p>
              <ul className="mt-8 space-y-3">
                {aiBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <BookOpenText className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-base text-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 rounded-2xl border border-border/60 bg-background/70 p-4 text-xs text-muted-foreground">
                {t("landing:ai.disclaimer")}
              </p>
            </div>
            <AIChatPreview />
          </div>
        </section>

        {/* Segurança */}
        <section id="seguranca" className="py-24">
          <div className="container-atlas grid gap-12 md:grid-cols-[1fr_1.2fr]">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Shield className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-foreground">
                {t("landing:security.title")}
              </h2>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {securityItems.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA final */}
        <section className="pb-24">
          <div className="container-atlas">
            <div className="rounded-3xl bg-foreground px-8 py-16 text-center text-background md:px-16">
              <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
                {t("landing:cta.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg opacity-80">
                {t("landing:cta.subtitle")}
              </p>
              <Button
                asChild
                size="lg"
                className="mt-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link to="/auth">{t("landing:cta.action")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-10">
        <div className="container-atlas flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <AtlasLogo />
          <p>© {new Date().getFullYear()} Meu Mundo Azul · {t("common:footer.rights")}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">{t("common:footer.lgpd")}</a>
            <a href="#" className="hover:text-foreground">{t("common:footer.privacy")}</a>
            <a href="#" className="hover:text-foreground">{t("common:footer.terms")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-md">
      <div className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Bom dia, Ana
            </p>
            <p className="mt-1 font-display text-lg font-bold text-foreground">
              O dia do Bento
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <PreviewRow
            time="09:00"
            title="Terapia ocupacional"
            subtitle="Dra. Marina · online"
            tone="primary"
          />
          <PreviewRow
            time="12:30"
            title="Metilfenidato · 10mg"
            subtitle="Confirmar administração"
            tone="accent"
          />
          <PreviewRow
            time="16:00"
            title="Fono — leitura"
            subtitle="Consultório"
            tone="muted"
          />
        </div>

        <div className="mt-5 rounded-2xl bg-primary-soft/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Azul IA
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            O sono do Bento melhorou 22% esta semana. Continuemos com a rotina
            das 20h30 — funcionou nos últimos 5 dias.
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({
  time,
  title,
  subtitle,
  tone,
}: {
  time: string;
  title: string;
  subtitle: string;
  tone: "primary" | "accent" | "muted";
}) {
  const dotClass =
    tone === "primary"
      ? "bg-primary"
      : tone === "accent"
        ? "bg-accent"
        : "bg-muted-foreground/40";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface p-3">
      <div className="w-14 text-xs font-semibold text-muted-foreground">{time}</div>
      <div className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function AIChatPreview() {
  return (
    <div className="rounded-3xl border border-border/70 bg-background p-5 shadow-lg">
      <div className="flex items-center gap-3 border-b border-border/60 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <p className="font-display text-sm font-bold">Azul IA</p>
          <p className="text-xs text-muted-foreground">Contexto ativo · Bento, 6 anos</p>
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">
          Crie uma história pro Bento sobre ir ao dentista pela primeira vez.
        </div>
        <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-2.5 text-foreground">
          Claro! "Hoje o Bento vai conhecer o dentista. Ele vai sentar numa
          cadeira grande que sobe e desce. A dentista vai contar até 3 antes de
          cada passo..." Quer que eu continue e adicione desenhos?
        </div>
      </div>
    </div>
  );
}
