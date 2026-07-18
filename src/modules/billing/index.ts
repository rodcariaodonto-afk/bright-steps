export type PlanCode = "free" | "family" | "professional" | "school" | "clinic" | "institutional";

export type BillingPeriod = "monthly" | "semiannual" | "annual" | "lifetime";

export interface Plan {
  code: PlanCode;
  displayName: string;
  description: string;
  monthlyPriceBRL: number;
  features: string[];
  seatsIncluded: number; // 0 = ilimitado
}

export const PLANS: Plan[] = [
  {
    code: "free",
    displayName: "Grátis",
    description: "Rotina básica, 1 criança, IA limitada.",
    monthlyPriceBRL: 0,
    features: ["1 criança", "Rotina básica", "IA (30 msgs/mês)"],
    seatsIncluded: 1,
  },
  {
    code: "family",
    displayName: "Família Premium",
    description: "Até 3 crianças, IA sem limite, integração com profissionais.",
    monthlyPriceBRL: 39.9,
    features: ["Até 3 crianças", "IA sem limite", "Timeline completa", "Vínculo com profissionais"],
    seatsIncluded: 3,
  },
  {
    code: "professional",
    displayName: "Profissional",
    description: "Painel clínico completo, agenda, evolução, relatórios.",
    monthlyPriceBRL: 89.9,
    features: ["Pacientes ilimitados", "Agenda", "Relatórios com IA", "Escalas flexíveis"],
    seatsIncluded: 0,
  },
  {
    code: "school",
    displayName: "Escola",
    description: "Área escolar, integração com famílias e profissionais.",
    monthlyPriceBRL: 149.9,
    features: ["Turmas", "Adaptações", "Comunicação estruturada"],
    seatsIncluded: 0,
  },
  {
    code: "clinic",
    displayName: "Clínica",
    description: "Multiprofissional, agenda unificada, indicadores da clínica.",
    monthlyPriceBRL: 399.9,
    features: ["Multi-profissional", "Agenda unificada", "Indicadores agregados"],
    seatsIncluded: 10,
  },
  {
    code: "institutional",
    displayName: "Institucional",
    description: "Redes, prefeituras, fundações. Preço sob consulta.",
    monthlyPriceBRL: 0,
    features: ["SSO", "Contrato personalizado", "Suporte dedicado"],
    seatsIncluded: 0,
  },
];

export interface Subscription {
  id: string;
  userId: string;
  planCode: PlanCode;
  period: BillingPeriod;
  status: "trialing" | "active" | "past_due" | "cancelled" | "expired";
  startedAt: string;
  currentPeriodEnd: string;
  couponCode?: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  validUntil: string;
  usageLimit?: number;
}
