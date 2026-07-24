/**
 * Catálogo de planos exibido em /planos, /app/assinatura e /admin/subscriptions.
 * Os price_id devem coincidir com o que foi cadastrado no provedor de pagamentos.
 */

export type PlanCode = "familia_essencial" | "familia_plus" | "profissional_clinica";

export interface PlanPrice {
  monthly: string;
  yearly: string;
  monthlyAmountBRL: number;
  yearlyAmountBRL: number;
}

export interface PublicPlan {
  code: PlanCode;
  displayName: string;
  tagline: string;
  price: PlanPrice;
  highlight?: boolean;
  features: string[];
  audience: "family" | "professional";
}

export const PUBLIC_PLANS: PublicPlan[] = [
  {
    code: "familia_essencial",
    displayName: "Família Essencial",
    tagline: "O básico bem feito para a rotina de uma criança.",
    price: {
      monthly: "familia_essencial_monthly",
      yearly: "familia_essencial_yearly",
      monthlyAmountBRL: 19,
      yearlyAmountBRL: 182,
    },
    audience: "family",
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
    price: {
      monthly: "familia_plus_monthly",
      yearly: "familia_plus_yearly",
      monthlyAmountBRL: 49,
      yearlyAmountBRL: 470,
    },
    audience: "family",
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
    price: {
      monthly: "profissional_clinica_monthly",
      yearly: "profissional_clinica_yearly",
      monthlyAmountBRL: 129,
      yearlyAmountBRL: 1238,
    },
    audience: "professional",
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

export function findPlanByPriceId(priceId: string): PublicPlan | undefined {
  return PUBLIC_PLANS.find(
    (p) => p.price.monthly === priceId || p.price.yearly === priceId,
  );
}

export function findPlanByCode(code: string): PublicPlan | undefined {
  return PUBLIC_PLANS.find((p) => p.code === code);
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
