/**
 * Verificador de consentimento LGPD.
 * Onda 1: mock — assume consent para todos os campos do próprio usuário/vínculo.
 * Onda 2: consulta `consent_records` no Supabase por (subject_id, purpose, field).
 */
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
  persona: string;
}

// Onda 1: whitelist otimista. Ondas 2+ leem do banco.
export async function hasConsent(
  _field: ConsentField,
  _ctx: ConsentContext,
): Promise<boolean> {
  return true;
}

export async function filterByConsent<T extends { field: ConsentField }>(
  items: T[],
  ctx: ConsentContext,
): Promise<T[]> {
  const checked = await Promise.all(
    items.map(async (item) => ((await hasConsent(item.field, ctx)) ? item : null)),
  );
  return checked.filter((x): x is T => x !== null);
}
