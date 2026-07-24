/**
 * Matriz de entitlements por plano.
 *
 * Ordem de acesso (soft-gate):
 *   free  <  familia_essencial  <  familia_plus / profissional_clinica
 *
 * - "free" = usuário logado sem assinatura ativa (nem trial).
 * - familia_plus e profissional_clinica compartilham TODAS as features do
 *   catálogo familiar; o plano Clínica adicionalmente libera o módulo /pro.
 */

import type { PlanCode } from "./plans";

export type Feature =
  // Núcleo (livre para qualquer logado)
  | "core_family"
  // Recursos que exigem qualquer plano pago
  | "ai_azul"
  | "kid_mode"
  | "multiple_children"
  // Recursos premium (Plus / Clínica)
  | "ai_unlimited"
  | "reports_ai"
  | "library"
  | "assessments"
  | "community"
  | "marketplace"
  | "school_share"
  | "caregiver"
  // Módulo profissional
  | "clinical_module";

export type EntitledPlan = PlanCode | "free";

const FREE_FEATURES: Feature[] = ["core_family"];

const ESSENCIAL_FEATURES: Feature[] = [
  ...FREE_FEATURES,
  "ai_azul",
  "kid_mode",
];

const PLUS_FEATURES: Feature[] = [
  ...ESSENCIAL_FEATURES,
  "ai_unlimited",
  "multiple_children",
  "reports_ai",
  "library",
  "assessments",
  "community",
  "marketplace",
  "school_share",
  "caregiver",
];

const CLINICA_FEATURES: Feature[] = [...PLUS_FEATURES, "clinical_module"];

export const ENTITLEMENTS: Record<EntitledPlan, Feature[]> = {
  free: FREE_FEATURES,
  familia_essencial: ESSENCIAL_FEATURES,
  familia_plus: PLUS_FEATURES,
  profissional_clinica: CLINICA_FEATURES,
};

export function hasFeature(
  plan: EntitledPlan | null | undefined,
  feature: Feature,
): boolean {
  if (!plan) return ENTITLEMENTS.free.includes(feature);
  return ENTITLEMENTS[plan].includes(feature);
}

/**
 * Mapa rota → feature exigida.
 * Rotas ausentes daqui são livres (dentro de /app).
 */
export const ROUTE_FEATURE: Record<string, Feature> = {
  "/app/ia": "ai_azul",
  "/app/relatorios": "reports_ai",
  "/app/biblioteca": "library",
  "/app/autoavaliacoes": "assessments",
  "/app/comunidade": "community",
  "/app/marketplace": "marketplace",
  "/app/escola": "school_share",
  "/app/cuidador": "caregiver",
};

/**
 * Rótulos amigáveis para o card de upgrade.
 */
export const FEATURE_LABEL: Record<Feature, string> = {
  core_family: "Recursos básicos da família",
  ai_azul: "IA Azul",
  kid_mode: "Modo criança (Mundo Azul)",
  multiple_children: "Mais de 1 criança",
  ai_unlimited: "IA Azul sem limite",
  reports_ai: "Relatórios com IA",
  library: "Biblioteca educativa",
  assessments: "Autoavaliações (M-CHAT-R e outras)",
  community: "Comunidade",
  marketplace: "Marketplace de profissionais",
  school_share: "Compartilhamento com escola",
  caregiver: "Bem-estar do cuidador",
  clinical_module: "Painel Clínico (Profissionais)",
};

/**
 * Plano mínimo que libera cada feature (usado para direcionar o upsell).
 */
export const FEATURE_MIN_PLAN: Record<Feature, PlanCode> = {
  core_family: "familia_essencial",
  ai_azul: "familia_essencial",
  kid_mode: "familia_essencial",
  multiple_children: "familia_plus",
  ai_unlimited: "familia_plus",
  reports_ai: "familia_plus",
  library: "familia_plus",
  assessments: "familia_plus",
  community: "familia_plus",
  marketplace: "familia_plus",
  school_share: "familia_plus",
  caregiver: "familia_plus",
  clinical_module: "profissional_clinica",
};
