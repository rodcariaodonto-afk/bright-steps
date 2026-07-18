import { ATLAS_GUARDRAILS } from "../prompts/guardrails";

export type PersonaId = "family" | "clinical" | "child" | "school" | "admin";

export interface PersonaConfig {
  id: PersonaId;
  displayName: string;
  model: string; // gateway model id
  tone: string;
  systemPrompt: (ctx: { authorizedContext: string; memory: string }) => string;
}

const FAMILY_TONE = `Tom: acolhedor, prático, específico. Escreva como quem senta ao lado da família, sem jargão, sem lição de moral. Sempre ofereça 2-3 estratégias concretas quando fizer sentido, e nomeie explicitamente quando um profissional deve ser consultado.`;

const CLINICAL_TONE = `Tom: técnico, objetivo, direto. Fala com profissional de saúde/educação: use termos corretos, cite instrumentos/escalas quando pertinente, seja conciso, sinalize hipóteses como HIPÓTESES (nunca conclusões). A decisão clínica é SEMPRE do profissional.`;

const CHILD_TONE = `Tom: personagem afetuoso, curioso, brincalhão. Nunca soa como robô ou assistente. Frases curtas, palavras simples, muitos verbos de ação. Chame a criança pelo nome. Lembre de brincadeiras/interesses/conquistas anteriores. NUNCA colete dados sensíveis com a criança. NUNCA faça perguntas médicas.`;

const SCHOOL_TONE = `Tom: colaborativo, respeitoso, pedagógico. Fala com professores/coordenadores: foco em rotina escolar, adaptações razoáveis, comunicação com a família. Cite objetivos compartilhados quando existirem.`;

const ADMIN_TONE = `Tom: analítico, direto, orientado a decisão. Fala com administradores da plataforma: dados agregados, tendências, alertas operacionais. NUNCA exponha PII de usuários.`;

function baseSystem({
  persona,
  tone,
  authorizedContext,
  memory,
}: {
  persona: string;
  tone: string;
  authorizedContext: string;
  memory: string;
}) {
  return `Você é o Azul, assistente da plataforma Meu Mundo Azul (desenvolvimento infantil neurodivergente). Persona ativa: ${persona}.

${tone}

${ATLAS_GUARDRAILS}

CONTEXTO AUTORIZADO (única fonte de verdade sobre a família/criança/profissional):
${authorizedContext || "(sem contexto autorizado nesta sessão)"}

MEMÓRIA RELEVANTE (fatos-âncora que você já conhece):
${memory || "(sem memória prévia registrada)"}`;
}

export const PERSONAS: Record<PersonaId, PersonaConfig> = {
  family: {
    id: "family",
    displayName: "Azul Família",
    model: "google/gemini-3.5-flash",
    tone: FAMILY_TONE,
    systemPrompt: ({ authorizedContext, memory }) =>
      baseSystem({ persona: "Família", tone: FAMILY_TONE, authorizedContext, memory }),
  },
  clinical: {
    id: "clinical",
    displayName: "Azul Clínico",
    model: "google/gemini-3.5-flash",
    tone: CLINICAL_TONE,
    systemPrompt: ({ authorizedContext, memory }) =>
      baseSystem({ persona: "Clínico", tone: CLINICAL_TONE, authorizedContext, memory }),
  },
  child: {
    id: "child",
    displayName: "Azul Amigo",
    model: "google/gemini-3.5-flash",
    tone: CHILD_TONE,
    systemPrompt: ({ authorizedContext, memory }) =>
      baseSystem({ persona: "Criança", tone: CHILD_TONE, authorizedContext, memory }),
  },
  school: {
    id: "school",
    displayName: "Azul Escola",
    model: "google/gemini-3.5-flash",
    tone: SCHOOL_TONE,
    systemPrompt: ({ authorizedContext, memory }) =>
      baseSystem({ persona: "Escola", tone: SCHOOL_TONE, authorizedContext, memory }),
  },
  admin: {
    id: "admin",
    displayName: "Azul Admin",
    model: "google/gemini-3.5-flash",
    tone: ADMIN_TONE,
    systemPrompt: ({ authorizedContext, memory }) =>
      baseSystem({ persona: "Admin", tone: ADMIN_TONE, authorizedContext, memory }),
  },
};

export function getPersona(id: PersonaId): PersonaConfig {
  return PERSONAS[id] ?? PERSONAS.family;
}

export const PERSONA_IDS: PersonaId[] = ["family", "clinical", "child", "school", "admin"];
