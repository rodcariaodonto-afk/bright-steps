import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Sparkles,
  HeartHandshake,
  CalendarDays,
  MessagesSquare,
  Shield,
  ArrowRight,
  ArrowDown,
  BookOpenText,
  Files,
  Network,
  Users,
  ClipboardList,
  Layers,
  Brain,
  GraduationCap,
  Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { AtlasLogo } from "@/components/atlas/atlas-logo";
import { LocaleSelector } from "@/components/i18n/locale-selector";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Meu Mundo Azul: plataforma para o desenvolvimento infantil e o neurodesenvolvimento",
      },
      {
        name: "description",
        content:
          "Organize rotina, terapias, humor e medicações. Uma IA acolhedora acompanha a jornada da sua criança do TEA ao TDAH, dislexia e além.",
      },
      {
        property: "og:title",
        content:
          "Meu Mundo Azul: plataforma para o desenvolvimento infantil e o neurodesenvolvimento",
      },
      {
        property: "og:description",
        content:
          "Organize rotina, terapias, humor e medicações. Uma IA acolhedora acompanha a jornada da sua criança do TEA ao TDAH, dislexia e além.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content:
          "Meu Mundo Azul: plataforma para o desenvolvimento infantil e o neurodesenvolvimento",
      },
      {
        name: "twitter:description",
        content:
          "Organize rotina, terapias, humor e medicações. Uma IA acolhedora acompanha a jornada da sua criança do TEA ao TDAH, dislexia e além.",
      },
    ],
  }),
  component: Landing,
});

const empathyIcons = [MessagesSquare, Files, Network, Users];
const flowIcons = [ClipboardList, Layers, Brain, GraduationCap];
const moduleIcons = [HeartHandshake, Sparkles, Network, Brain];

type NamedItem = { title: string; description: string };
type StatItem = { n: string; d: string };
type FlowHighlight = { title: string; lines: string[]; cta: string };
type BeforeAfterCard = { before: string[]; after: string };

function Landing() {
  const { t } = useTranslation("landing", { useSuspense: false });

  const empathyItems = asArray<NamedItem>(t("empathy.items", { returnObjects: true }));
  const flowSteps = asArray<NamedItem>(t("flow.steps", { returnObjects: true }));
  const flowHighlight = t("flow.highlight", { returnObjects: true }) as FlowHighlight;
  const flowHighlightLines = asArray<string>(flowHighlight?.lines);
  const modules = asArray<NamedItem>(t("modules.items", { returnObjects: true }));
  const aiBullets = asArray<string>(t("ai.bullets", { returnObjects: true }));
  const securityItems = asArray<string>(t("security.items", { returnObjects: true }));
  const stats = asArray<StatItem>(t("awareness.stats", { returnObjects: true }));
  const beforeAfterCards = asArray<BeforeAfterCard>(
    t("beforeAfter.cards", { returnObjects: true }),
  );
  const ctaMicrocopy = asArray<string>(t("cta.microcopy", { returnObjects: true }));

  return (
    <div className="min-h-dvh bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container-atlas flex h-16 items-center justify-between">
          <Link to="/" aria-label="Meu Mundo Azul">
            <AtlasLogo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#pilares" className="hover:text-foreground">{t("nav.product")}</a>
            <a href="#modulos" className="hover:text-foreground">{t("nav.family")}</a>
            <a href="#ia" className="hover:text-foreground">{t("nav.ai")}</a>
            <Link to="/planos" className="hover:text-foreground">{t("nav.pricing")}</Link>
            <a href="#seguranca" className="hover:text-foreground">{t("nav.security")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LocaleSelector variant="compact" align="end" className="hidden sm:inline-flex" />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/planos">{t("nav.pricing")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">{t("nav.signIn")}</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/planos">{t("nav.start")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* 1. Hero */}
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
                {t("hero.eyebrow")}
              </p>
              <h1 className="mt-6 text-balance text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t("hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link to="/auth">
                    {t("hero.primaryCta")}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <a href="#modulos">{t("hero.secondaryCta")}</a>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">{t("hero.trust")}</p>
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

        {/* 2. Dor da Família */}
        <section className="border-t border-border/60 bg-surface-2/60 py-24">
          <div className="container-atlas">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-bold tracking-tight text-foreground">
                {t("empathy.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("empathy.subtitle")}</p>
              <p className="mt-4 text-lg text-muted-foreground">{t("empathy.subtitleExtra")}</p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {empathyItems.map((item, idx) => {
                const Icon = empathyIcons[idx] ?? Sparkles;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="mt-12 rounded-3xl bg-primary-soft p-8 md:p-10"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <h3 className="text-2xl font-semibold text-foreground">
                    {t("empathy.highlight.title")}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {t("empathy.highlight.description")}
                  </p>
                </div>
                <Button asChild size="lg" className="rounded-full">
                  <a href="#pilares">
                    {t("empathy.highlight.cta")}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. Nova forma de pensar */}
        <section id="pilares" className="py-24">
          <div className="container-atlas">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-bold tracking-tight text-foreground">
                {t("flow.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("flow.description")}</p>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {flowSteps.map((step, idx) => {
                const Icon = flowIcons[idx] ?? Sparkles;
                const isLast = idx === flowSteps.length - 1;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="relative rounded-3xl border border-border/70 bg-card p-6 shadow-sm"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                    {!isLast && (
                      <div
                        aria-hidden="true"
                        className="mt-4 flex items-center justify-center text-primary/60 lg:absolute lg:right-[-14px] lg:top-1/2 lg:mt-0 lg:-translate-y-1/2 lg:rotate-[-90deg]"
                      >
                        <ArrowDown className="h-5 w-5" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="mt-12 rounded-3xl bg-primary-soft p-8 md:p-10"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <h3 className="text-2xl font-semibold text-foreground">
                    {flowHighlight?.title}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {flowHighlightLines.map((line) => (
                      <li
                        key={line}
                        className="flex items-start gap-2 text-base leading-relaxed text-muted-foreground"
                      >
                        <Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button asChild size="lg" className="rounded-full">
                  <a href="#modulos">
                    {flowHighlight?.cta}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 4. Funcionalidades (benefícios) */}
        <section id="modulos" className="border-t border-border/60 bg-surface-2/60 py-24">
          <div className="container-atlas">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-bold tracking-tight text-foreground">
                {t("modules.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("modules.subtitle")}</p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {modules.map((item, idx) => {
                const Icon = moduleIcons[idx] ?? Sparkles;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-10 flex justify-start">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/auth">{t("modules.cta")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 5. IA */}
        <section
          id="ia"
          className="relative overflow-hidden border-y border-border/60 bg-primary-soft/60 py-24"
        >
          <div className="container-atlas grid gap-12 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {t("ai.eyebrow")}
              </p>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-foreground">
                {t("ai.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("ai.description")}</p>
              <ul className="mt-8 space-y-3">
                {aiBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <BookOpenText className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-base text-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 rounded-2xl border border-border/60 bg-background/70 p-4 text-xs text-muted-foreground">
                {t("ai.disclaimer")}
              </p>
            </div>
            <AIChatPreview />
          </div>
        </section>

        {/* 6. Segurança */}
        <section id="seguranca" className="py-24">
          <div className="container-atlas grid gap-12 md:grid-cols-[1fr_1.2fr]">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Shield className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="mt-6 text-4xl font-bold tracking-tight text-foreground">
                {t("security.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("security.subtitle")}</p>
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

        {/* 7. Dados */}
        <section className="border-t border-border/60 bg-primary-soft/40 py-24">
          <div className="container-atlas space-y-10">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("awareness.eyebrow")}
              </span>
              <h2 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
                {t("awareness.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("awareness.subtitle")}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.n} className="rounded-2xl border border-border/60 bg-card p-6">
                  <p className="text-3xl font-bold text-primary">{s.n}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t("awareness.sources")}</p>
          </div>
        </section>

        {/* 8. Antes x Depois */}
        <section className="py-24">
          <div className="container-atlas">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-bold tracking-tight text-foreground">
                {t("beforeAfter.title")}
              </h2>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {beforeAfterCards.map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="flex flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {t("beforeAfter.beforeLabel")}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {asArray<string>(card.before).map((line) => (
                        <li key={line} className="text-sm text-foreground/80">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    aria-hidden="true"
                    className="my-5 flex items-center justify-center text-primary/60"
                  >
                    <ArrowDown className="h-5 w-5" />
                  </div>
                  <div className="rounded-2xl bg-primary-soft p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                      {t("beforeAfter.afterLabel")}
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">{card.after}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/auth">
                  {t("beforeAfter.cta")}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 9. CTA final */}
        <section className="pb-24">
          <div className="container-atlas">
            <div className="rounded-3xl bg-foreground px-8 py-16 text-center text-background md:px-16">
              <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
                {t("cta.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg opacity-80">{t("cta.subtitle")}</p>
              <Button
                asChild
                size="lg"
                className="mt-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link to="/auth">{t("cta.action")}</Link>
              </Button>
              {ctaMicrocopy.length > 0 && (
                <ul className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm opacity-75">
                  {ctaMicrocopy.map((line) => (
                    <li key={line} className="flex items-center gap-2">
                      <Check className="h-4 w-4" aria-hidden="true" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-10">
        <div className="container-atlas flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <AtlasLogo />
          <p>© {new Date().getFullYear()} Meu Mundo Azul · {t("footer.rights")}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">{t("footer.lgpd")}</a>
            <a href="#" className="hover:text-foreground">{t("footer.privacy")}</a>
            <a href="#" className="hover:text-foreground">{t("footer.terms")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function HeroPreview() {
  const { t } = useTranslation("landing");
  return (
    <div className="relative mx-auto max-w-md">
      <div className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("heroPreview.greeting")}
            </p>
            <p className="mt-1 font-display text-lg font-bold text-foreground">
              {t("heroPreview.childDay")}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <PreviewRow
            time="09:00"
            title={t("heroPreview.row1Title")}
            subtitle={t("heroPreview.row1Subtitle")}
            tone="primary"
          />
          <PreviewRow
            time="12:30"
            title={t("heroPreview.row2Title")}
            subtitle={t("heroPreview.row2Subtitle")}
            tone="accent"
          />
          <PreviewRow
            time="16:00"
            title={t("heroPreview.row3Title")}
            subtitle={t("heroPreview.row3Subtitle")}
            tone="muted"
          />
        </div>

        <div className="mt-5 rounded-2xl bg-primary-soft/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t("heroPreview.aiLabel")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {t("heroPreview.aiMessage")}
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
  const { t } = useTranslation("landing");
  return (
    <div className="rounded-3xl border border-border/70 bg-background p-5 shadow-lg">
      <div className="flex items-center gap-3 border-b border-border/60 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <p className="font-display text-sm font-bold">{t("aiPreview.name")}</p>
          <p className="text-xs text-muted-foreground">{t("aiPreview.context")}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">
          {t("aiPreview.userMessage")}
        </div>
        <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-2.5 text-foreground">
          {t("aiPreview.aiMessage")}
        </div>
      </div>
    </div>
  );
}
