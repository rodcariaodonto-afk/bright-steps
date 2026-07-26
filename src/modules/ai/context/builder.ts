import type { SupabaseClient } from "@supabase/supabase-js";

import type { PersonaId } from "../personas";
import {
  hasConsentBulk,
  hasScopeConsent,
  type ConsentContext,
  type ConsentField,
} from "./consent";

/**
 * ContextBundle — o que a IA sabe sobre a situação atual.
 * Todo campo sensível só entra aqui se houver consent ativo em `consent_records`.
 * Fail closed: sem consent → campo omitido (a IA não deve nem saber que existe).
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
  /**
   * Client Supabase autenticado do request. Necessário para popular `childProfile`
   * respeitando `consent_records` + RLS. Se ausente, o bundle sai sem dados da criança.
   */
  supabase?: SupabaseClient<any, any, any> | null;
}

function ageFromBirthdate(birthDate: string | null | undefined): number | undefined {
  if (!birthDate) return undefined;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : undefined;
}

async function loadChildProfile(
  supabase: SupabaseClient<any, any, any>,
  childId: string,
  consent: Set<ConsentField>,
): Promise<ContextBundle["childProfile"] | undefined> {
  const { data: child, error } = await supabase
    .from("children")
    .select("full_name, birth_date, nickname, dominant_interest, declared_conditions")
    .eq("id", childId)
    .maybeSingle();
  if (error || !child) return undefined;

  // Sem consent para nome → nem retorna o perfil (a IA não deve saber que existe).
  if (!consent.has("child.name")) return undefined;

  const firstName =
    (child.nickname as string | null)?.trim() ||
    ((child.full_name as string | null)?.split(" ")[0] ?? "");
  if (!firstName) return undefined;

  const profile: NonNullable<ContextBundle["childProfile"]> = { firstName };

  if (consent.has("child.birthdate")) {
    const age = ageFromBirthdate(child.birth_date as string | null);
    if (age !== undefined) profile.ageYears = age;
  }

  // dominant_interest é preferência lúdica, não é PHI → sempre incluído se existir.
  if (child.dominant_interest) profile.dominantInterest = child.dominant_interest as string;

  if (consent.has("child.diagnosis")) {
    const list = (child.declared_conditions as string[] | null) ?? [];
    if (list.length) profile.diagnoses = list;
  }

  if (consent.has("child.medications")) {
    const { data: meds } = await supabase
      .from("medications")
      .select("name, dose, schedule")
      .eq("child_id", childId)
      .eq("active", true)
      .limit(20);
    if (meds?.length) {
      profile.activeMedications = meds.map((m: { name: string; dose?: string | null }) =>
        m.dose ? `${m.name} (${m.dose})` : m.name,
      );
    }
  }

  if (consent.has("child.goals")) {
    const { data: goals } = await supabase
      .from("goals")
      .select("title, status")
      .eq("child_id", childId)
      .eq("status", "active")
      .limit(10);
    if (goals?.length) {
      profile.activeGoals = goals.map((g: { title: string }) => g.title);
    }
  }

  if (consent.has("child.mood")) {
    const { data: mood } = await supabase
      .from("mood_logs")
      .select("mood_level, created_at")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(7);
    if (mood?.length) {
      const avg = mood.reduce((s: number, m: { mood_level: number }) => s + m.mood_level, 0) / mood.length;
      profile.lastMoodTrend = `média últimas ${mood.length} entradas: ${avg.toFixed(1)}`;
    }
  }

  if (consent.has("child.sessions")) {
    const { data: last } = await supabase
      .from("clinical_sessions")
      .select("summary, session_date")
      .eq("child_id", childId)
      .order("session_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last?.summary) profile.lastSessionSummary = last.summary as string;
  }

  return profile;
}

/**
 * Monta o ContextBundle respeitando consent_records + RLS.
 * Sem `input.supabase`, devolve bundle "vazio" (sem childProfile) — comportamento
 * compatível com callers que ainda não passam o client.
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

  const bundle: ContextBundle = {
    requesterId: input.requesterId,
    requesterRole: role,
    childId: input.childId,
    now: new Date().toISOString(),
    locale: input.locale ?? "pt-BR",
  };

  if (!input.supabase || !input.childId) return bundle;

  const consentCtx: ConsentContext = {
    requesterId: input.requesterId,
    subjectId: input.childId,
    subjectKind: "child",
    persona: input.persona,
    supabase: input.supabase,
  };

  // Gate de papel: profissional/escola só recebem contexto se o scope compartilhado estiver ativo.
  if (role === "professional") {
    const ok = await hasScopeConsent("clinical_share", consentCtx);
    if (!ok) return bundle;
  } else if (role === "school") {
    const ok = await hasScopeConsent("school_share", consentCtx);
    if (!ok) return bundle;
  }

  const fields: ConsentField[] = [
    "child.name",
    "child.birthdate",
    "child.diagnosis",
    "child.medications",
    "child.goals",
    "child.mood",
    "child.sessions",
  ];
  const granted = await hasConsentBulk(fields, consentCtx);

  const profile = await loadChildProfile(input.supabase, input.childId, granted);
  if (profile) bundle.childProfile = profile;

  return bundle;
}

/**
 * Serializa o bundle para injeção no system prompt.
 * Guarda extra: persona "child" NUNCA recebe campos clínicos, mesmo com consent.
 */
export function serializeContext(bundle: ContextBundle): string {
  const lines: string[] = [];
  lines.push(`- Data/hora: ${bundle.now}`);
  lines.push(`- Papel do interlocutor: ${bundle.requesterRole}`);

  if (bundle.childProfile) {
    const c = { ...bundle.childProfile };
    if (bundle.requesterRole === "child") {
      // Última linha de defesa: criança não recebe conteúdo clínico via IA.
      delete c.diagnoses;
      delete c.activeMedications;
      delete c.activeGoals;
      delete c.lastMoodTrend;
      delete c.lastSessionSummary;
    }
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
