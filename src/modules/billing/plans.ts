/**
 * Catálogo de planos exibido em /planos, /app/assinatura e /admin/subscriptions.
 * Os price_id devem coincidir com o que foi cadastrado no provedor de pagamentos.
 *
 * Multi-currency: cada plano tem preços nativos em BRL, USD e EUR.
 * Locales fora dessas moedas caem para USD (padrão global) ou EUR (zona euro).
 */

import type { LocaleCode } from "@/i18n/config";
import { LOCALES } from "@/i18n/config";

export type PlanCode = "familia_essencial" | "familia_plus" | "profissional_clinica";
export type BillingCurrency = "BRL" | "USD" | "EUR";
export type BillingPeriod = "monthly" | "yearly";

export interface PriceEntry {
  priceId: string;
  amount: number; // valor "humano" (ex: 19, 3.99), já pronto para formatação
}

export interface PlanPricing {
  BRL: { monthly: PriceEntry; yearly: PriceEntry };
  USD: { monthly: PriceEntry; yearly: PriceEntry };
  EUR: { monthly: PriceEntry; yearly: PriceEntry };
}

export interface PublicPlan {
  code: PlanCode;
  displayName: string;
  tagline: string;
  pricing: PlanPricing;
  highlight?: boolean;
  features: string[];
  audience: "family" | "professional";
}

export const PUBLIC_PLANS: PublicPlan[] = [
  {
    code: "familia_essencial",
    displayName: "Família Essencial",
    tagline: "O básico bem feito para a rotina de uma criança.",
    audience: "family",
    pricing: {
      BRL: {
        monthly: { priceId: "familia_essencial_monthly", amount: 19 },
        yearly: { priceId: "familia_essencial_yearly", amount: 182 },
      },
      USD: {
        monthly: { priceId: "familia_essencial_monthly_usd", amount: 3.99 },
        yearly: { priceId: "familia_essencial_yearly_usd", amount: 38 },
      },
      EUR: {
        monthly: { priceId: "familia_essencial_monthly_eur", amount: 3.99 },
        yearly: { priceId: "familia_essencial_yearly_eur", amount: 38 },
      },
    },
    features: [
      "1 criança + até 3 responsáveis",
      "Rotina, humor, medicação e timeline",
      "Calendário unificado",
      "IA Azul com limite mensal",
      "Suporte por e-mail",
    ],
  },
  {
    code: "familia_plus",
    displayName: "Família Plus",
    tagline: "A jornada completa da família com IA sem limites.",
    highlight: true,
    audience: "family",
    pricing: {
      BRL: {
        monthly: { priceId: "familia_plus_monthly", amount: 49 },
        yearly: { priceId: "familia_plus_yearly", amount: 470 },
      },
      USD: {
        monthly: { priceId: "familia_plus_monthly_usd", amount: 8.99 },
        yearly: { priceId: "familia_plus_yearly_usd", amount: 89 },
      },
      EUR: {
        monthly: { priceId: "familia_plus_monthly_eur", amount: 8.99 },
        yearly: { priceId: "familia_plus_yearly_eur", amount: 89 },
      },
    },
    features: [
      "Até 3 crianças + responsáveis ilimitados",
      "Tudo do Essencial",
      "IA Azul sem limite",
      "Relatórios semanais com IA",
      "Biblioteca, autoavaliações e comunidade",
      "Marketplace de profissionais",
      "Compartilhamento com escola",
    ],
  },
  {
    code: "profissional_clinica",
    displayName: "Profissional Clínica",
    tagline: "Painel clínico completo para profissionais autônomos.",
    audience: "professional",
    pricing: {
      BRL: {
        monthly: { priceId: "profissional_clinica_monthly", amount: 129 },
        yearly: { priceId: "profissional_clinica_yearly", amount: 1238 },
      },
      USD: {
        monthly: { priceId: "profissional_clinica_monthly_usd", amount: 24.99 },
        yearly: { priceId: "profissional_clinica_yearly_usd", amount: 239 },
      },
      EUR: {
        monthly: { priceId: "profissional_clinica_monthly_eur", amount: 22.99 },
        yearly: { priceId: "profissional_clinica_yearly_eur", amount: 219 },
      },
    },
    features: [
      "Pacientes ilimitados",
      "Prontuário SOAP + evolução",
      "Agenda inteligente",
      "Escalas e relatórios com IA",
      "Perfil verificado no marketplace",
      "Chat com famílias e escolas",
    ],
  },
];

export const TRIAL_DAYS = 7;

/** Mapa locale → moeda de cobrança suportada. */
const EURO_COUNTRIES = new Set([
  "AT","BE","CY","EE","FI","FR","DE","GR","IE","IT","LV","LT","LU","MT","NL","PT","SK","SI","ES",
]);

export function billingCurrencyForLocale(locale: LocaleCode): BillingCurrency {
  if (locale === "pt-BR") return "BRL";
  const meta = LOCALES[locale];
  if (meta?.defaultCurrency === "EUR" || EURO_COUNTRIES.has(meta?.country ?? "")) return "EUR";
  // qualquer outro (en, ja, ko, zh, ru, tr, ar, pl…) cobra em USD por padrão
  return "USD";
}

export function resolvePrice(
  plan: PublicPlan,
  period: BillingPeriod,
  currency: BillingCurrency,
): PriceEntry {
  return plan.pricing[currency][period];
}

export function findPlanByPriceId(priceId: string): PublicPlan | undefined {
  return PUBLIC_PLANS.find((p) =>
    (["BRL", "USD", "EUR"] as BillingCurrency[]).some(
      (c) => p.pricing[c].monthly.priceId === priceId || p.pricing[c].yearly.priceId === priceId,
    ),
  );
}

/** Detecta a moeda a partir de qualquer priceId conhecido. */
export function currencyOfPriceId(priceId: string): BillingCurrency | undefined {
  for (const plan of PUBLIC_PLANS) {
    for (const c of ["BRL", "USD", "EUR"] as BillingCurrency[]) {
      if (plan.pricing[c].monthly.priceId === priceId) return c;
      if (plan.pricing[c].yearly.priceId === priceId) return c;
    }
  }
  return undefined;
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
