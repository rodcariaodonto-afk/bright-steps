/**
 * Gate de consentimento LGPD para o contexto de IA.
 *
 * Fail closed: sem registro em `consent_records` (granted=true, revoked_at is null),
 * o campo é tratado como NÃO consentido. Qualquer erro de rede/RLS também fecha.
 *
 * A tabela `public.consent_records` tem RLS ativo; usamos o client autenticado do
 * request para que a consulta reflita o que o próprio usuário/família pode ver.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type ConsentField =
  | "child.name"
  | "child.birthdate"
  | "child.diagnosis"
  | "child.medications"
  | "child.routines"
  | "child.mood"
  | "child.behavior"
  | "child.goals"
  | "child.sessions"
  | "child.evolution"
  | "child.school"
  | "family.notes"
  | "professional.notes";

export interface ConsentContext {
  requesterId: string;
  subjectId: string; // child id ou user id
  subjectKind?: "child" | "user"; // default: "child"
  persona: string;
  supabase?: SupabaseClient<any, any, any> | null;
}

type Scope =
  | "ai_context"
  | "ai_memory"
  | "clinical_share"
  | "school_share"
  | "marketplace_personalization"
  | "community_visibility"
  | "analytics"
  | "marketing";

// Mapa: cada ConsentField exige (scope, purpose) específico em consent_records.
// Purpose usa o próprio nome do campo para rastreabilidade granular.
const FIELD_TO_CONSENT: Record<ConsentField, { scope: Scope; purpose: string }> = {
  "child.name": { scope: "ai_context", purpose: "child.name" },
  "child.birthdate": { scope: "ai_context", purpose: "child.birthdate" },
  "child.diagnosis": { scope: "ai_context", purpose: "child.diagnosis" },
  "child.medications": { scope: "ai_context", purpose: "child.medications" },
  "child.routines": { scope: "ai_context", purpose: "child.routines" },
  "child.mood": { scope: "ai_context", purpose: "child.mood" },
  "child.behavior": { scope: "ai_context", purpose: "child.behavior" },
  "child.goals": { scope: "ai_context", purpose: "child.goals" },
  "child.sessions": { scope: "ai_context", purpose: "child.sessions" },
  "child.evolution": { scope: "ai_context", purpose: "child.evolution" },
  "child.school": { scope: "ai_context", purpose: "child.school" },
  "family.notes": { scope: "ai_context", purpose: "family.notes" },
  "professional.notes": { scope: "ai_context", purpose: "professional.notes" },
};

export function consentMappingFor(field: ConsentField): { scope: Scope; purpose: string } {
  return FIELD_TO_CONSENT[field];
}

function subjectColumn(kind: "child" | "user"): "subject_child_id" | "subject_user_id" {
  return kind === "child" ? "subject_child_id" : "subject_user_id";
}

/**
 * Consulta pontual — retorna true apenas se houver linha ativa em consent_records
 * para (scope, purpose, subject). Qualquer falha => false (fail closed).
 */
export async function hasConsent(
  field: ConsentField,
  ctx: ConsentContext,
): Promise<boolean> {
  if (!ctx.supabase) return false;
  const kind = ctx.subjectKind ?? "child";
  const { scope, purpose } = FIELD_TO_CONSENT[field];
  try {
    const { data, error } = await ctx.supabase
      .from("consent_records")
      .select("id")
      .eq("scope", scope)
      .eq("purpose", purpose)
      .eq("granted", true)
      .is("revoked_at", null)
      .eq(subjectColumn(kind), ctx.subjectId)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn("[consent] query failed, fail closed", { field, error: error.message });
      return false;
    }
    return !!data;
  } catch (err) {
    console.warn("[consent] exception, fail closed", {
      field,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * Versão em lote: uma query só devolve o conjunto de campos consentidos.
 * Ideal para builder de contexto (evita N round-trips).
 */
export async function hasConsentBulk(
  fields: ConsentField[],
  ctx: ConsentContext,
): Promise<Set<ConsentField>> {
  const granted = new Set<ConsentField>();
  if (!ctx.supabase || fields.length === 0) return granted;
  const kind = ctx.subjectKind ?? "child";
  const purposes = fields.map((f) => FIELD_TO_CONSENT[f].purpose);
  try {
    const { data, error } = await ctx.supabase
      .from("consent_records")
      .select("scope,purpose")
      .in("purpose", purposes)
      .eq("granted", true)
      .is("revoked_at", null)
      .eq(subjectColumn(kind), ctx.subjectId);
    if (error) {
      console.warn("[consent] bulk query failed, fail closed", { error: error.message });
      return granted;
    }
    const activePairs = new Set(
      (data ?? []).map((r: { scope: string; purpose: string }) => `${r.scope}::${r.purpose}`),
    );
    for (const f of fields) {
      const m = FIELD_TO_CONSENT[f];
      if (activePairs.has(`${m.scope}::${m.purpose}`)) granted.add(f);
    }
    return granted;
  } catch (err) {
    console.warn("[consent] bulk exception, fail closed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return granted;
  }
}

/**
 * Consent de escopo puro (sem purpose granular) — usado para gates de papel
 * (ex.: clinical_share, school_share). Fail closed.
 */
export async function hasScopeConsent(
  scope: Scope,
  ctx: ConsentContext,
): Promise<boolean> {
  if (!ctx.supabase) return false;
  const kind = ctx.subjectKind ?? "child";
  try {
    const { data, error } = await ctx.supabase
      .from("consent_records")
      .select("id")
      .eq("scope", scope)
      .eq("granted", true)
      .is("revoked_at", null)
      .eq(subjectColumn(kind), ctx.subjectId)
      .limit(1)
      .maybeSingle();
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

export async function filterByConsent<T extends { field: ConsentField }>(
  items: T[],
  ctx: ConsentContext,
): Promise<T[]> {
  const results: T[] = [];
  for (const item of items) {
    if (await hasConsent(item.field, ctx)) results.push(item);
  }
  return results;
}
