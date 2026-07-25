import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { PaymentTestModeBanner } from "@/components/billing/payment-test-mode-banner";
import { useSession } from "@/hooks/use-session";
import { useLocale } from "@/i18n/hooks";
import { PUBLIC_PLANS, TRIAL_DAYS, formatBRL, type PublicPlan } from "@/modules/billing/plans";
import { displayPriceFromBRL } from "@/modules/billing/currency";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos e assinatura, Meu Mundo Azul" },
      {
        name: "description",
        content:
          "Escolha o plano ideal para acompanhar o desenvolvimento infantil. 7 dias grátis em todos os planos. Cancele quando quiser.",
      },
      { property: "og:title", content: "Planos, Meu Mundo Azul" },
      {
        property: "og:description",
        content:
          "Família Essencial, Família Plus e Profissional Clínica. Trial de 7 dias sem cartão obrigatório na prévia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Planos, Meu Mundo Azul" },
      {
        name: "twitter:description",
        content: "3 planos com 7 dias grátis para toda a família e profissionais.",
      },
    ],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const { session } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation("landing");
  const { locale } = useLocale();

  const handleChoose = (plan: PublicPlan) => {
    const priceId = period === "monthly" ? plan.price.monthly : plan.price.yearly;
    if (!session) {
      const redirectTo = `/planos/checkout?priceId=${encodeURIComponent(priceId)}`;
      navigate({ to: "/auth", search: { redirect: redirectTo } as never });
      return;
    }
    navigate({
      to: "/planos/checkout",
      search: { priceId } as never,
    });
  };

  return (
    <div className="min-h-dvh bg-surface-2">
      <PaymentTestModeBanner />
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
            <InfinityIcon className="h-6 w-6 text-primary" /> Meu Mundo Azul
          </Link>
          <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground">
            {t("plans.backToApp")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {t("plans.trialBadge", { days: TRIAL_DAYS })}
          </p>
          <h1 className="mt-4 text-4xl font-bold text-foreground sm:text-5xl">
            {t("plans.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
            {t("plans.subtitle")}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-border/60 bg-background p-1 text-sm">
            <button
              type="button"
              onClick={() => setPeriod("monthly")}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium transition",
                period === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("plans.monthly")}
            </button>
            <button
              type="button"
              onClick={() => setPeriod("yearly")}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium transition",
                period === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("plans.yearly")}{" "}
              <span className="ml-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                {t("plans.yearlyDiscount")}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PUBLIC_PLANS.map((plan) => {
            const amountBRL =
              period === "monthly" ? plan.price.monthlyAmountBRL : plan.price.yearlyAmountBRL;
            const priceInfo = displayPriceFromBRL(amountBRL, locale);
            const monthlyEquivBRL = Math.round(amountBRL / 12);
            const monthlyEquiv = displayPriceFromBRL(monthlyEquivBRL, locale);

            const featuresRaw = t(`plans.items.${plan.code}.features`, {
              returnObjects: true,
              defaultValue: plan.features,
            }) as unknown;
            const features = Array.isArray(featuresRaw) ? (featuresRaw as string[]) : plan.features;
            const displayName = t(`plans.items.${plan.code}.name`, {
              defaultValue: plan.displayName,
            });
            const tagline = t(`plans.items.${plan.code}.tagline`, {
              defaultValue: plan.tagline,
            });

            return (
              <div
                key={plan.code}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-background p-6 shadow-sm",
                  plan.highlight
                    ? "border-primary/60 shadow-lg ring-2 ring-primary/20"
                    : "border-border/60",
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase text-primary-foreground">
                    {t("plans.highlight")}
                  </span>
                )}
                <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
                <div className="mt-6">
                  <p className="text-4xl font-black text-foreground">
                    {priceInfo.text}
                    <span className="text-base font-medium text-muted-foreground">
                      {period === "monthly" ? t("plans.perMonth") : t("plans.perYear")}
                    </span>
                  </p>
                  {period === "yearly" && (
                    <p className="mt-1 text-xs text-emerald-700">
                      {t("plans.equivalentMonth", { price: monthlyEquiv.text })}
                    </p>
                  )}
                  {priceInfo.converted && (
                    <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                      {t("plans.convertedNote", { price: formatBRL(amountBRL) })}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleChoose(plan)}
                  className="mt-6 w-full"
                  variant={plan.highlight ? "default" : "outline"}
                >
                  {t("plans.cta")}
                </Button>
                <ul className="mt-6 space-y-2 text-sm text-foreground">
                  {features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">{t("plans.footer")}</p>
      </main>
    </div>
  );
}
