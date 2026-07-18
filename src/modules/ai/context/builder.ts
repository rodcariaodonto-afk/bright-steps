import type { PersonaId } from "../personas";

/**
 * ContextBundle — o que a IA sabe sobre a situação atual.
 * Onda 1: montado a partir de dados mock/session.
 * Onda 2: montado a partir do Supabase respeitando consent_records + RLS.
 */
export interface ContextBundle {
  requesterId: string;
  requesterRole: "family" | "professional" | "school" | "child" | "admin";
  childId?: string;
  childProfile?: {
    firstName: string;
    ageYears?: number;
    dominantInterest?: string;
    diagnoses?: string[];
    activeGoals?: string[];
    activeMedications?: string[];
    lastMoodTrend?: string;
    lastSessionSummary?: string;
  };
  now: string; // ISO
  locale: string;
}

export interface BuildContextInput {
  persona: PersonaId;
  requesterId: string;
  childId?: string;
  locale?: string;
}

/**
 * Onda 1: retorna bundle vazio ou com dados de sessão.
 * A UI passa o childId ativo; sem childId, o bundle não contém dados de criança.
 */
export async function buildContext(input: BuildContextInput): Promise<ContextBundle> {
  const role: ContextBundle["requesterRole"] =
    input.persona === "family"
      ? "family"
      : input.persona === "clinical"
        ? "professional"
        : input.persona === "school"
          ? "school"
          : input.persona === "child"
            ? "child"
            : "admin";

  return {
    requesterId: input.requesterId,
    requesterRole: role,
    childId: input.childId,
    now: new Date().toISOString(),
    locale: input.locale ?? "pt-BR",
  };
}

/**
 * Serializa o bundle para injeção no system prompt.
 * Mantém a estrutura verbosa mas legível para o modelo — não JSON.
 */
export function serializeContext(bundle: ContextBundle): string {
  const lines: string[] = [];
  lines.push(`- Data/hora: ${bundle.now}`);
  lines.push(`- Papel do interlocutor: ${bundle.requesterRole}`);
  if (bundle.childProfile) {
    const c = bundle.childProfile;
    lines.push(`- Criança: ${c.firstName}${c.ageYears ? `, ${c.ageYears} anos` : ""}`);
    if (c.dominantInterest) lines.push(`- Interesse dominante: ${c.dominantInterest}`);
    if (c.diagnoses?.length) lines.push(`- Diagnósticos registrados: ${c.diagnoses.join(", ")}`);
    if (c.activeGoals?.length) lines.push(`- Objetivos ativos: ${c.activeGoals.join("; ")}`);
    if (c.activeMedications?.length)
      lines.push(`- Medicações em curso: ${c.activeMedications.join("; ")}`);
    if (c.lastMoodTrend) lines.push(`- Tendência de humor recente: ${c.lastMoodTrend}`);
    if (c.lastSessionSummary) lines.push(`- Última sessão: ${c.lastSessionSummary}`);
  } else if (bundle.requesterRole !== "admin") {
    lines.push(`- (Nenhuma criança selecionada no contexto)`);
  }
  return lines.join("\n");
}
