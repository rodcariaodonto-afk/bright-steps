// @ts-expect-error bun:test não tem types instalados; runtime via `bun test`.
import { describe, expect, it, spyOn } from "bun:test";
const vi = { spyOn };

import { buildContext, serializeContext } from "../builder";
import { hasConsent, type ConsentField } from "../consent";

/**
 * Mock mínimo do supabase-js: implementa apenas a cadeia usada em consent.ts / builder.ts.
 * Cada chamada `.from(table)` consulta a factory `handlers[table]` que devolve as linhas.
 */
function makeSupabase(handlers: {
  consent_records?: Array<{ scope: string; purpose: string }>;
  children?: Record<string, any> | null;
  medications?: any[];
  goals?: any[];
  mood_logs?: any[];
  clinical_sessions?: any | null;
}) {
  const chain = (rows: any) => {
    const q: any = {
      _rows: Array.isArray(rows) ? rows : rows ? [rows] : [],
      _filters: [] as Array<(r: any) => boolean>,
      eq(col: string, val: any) {
        this._filters.push((r: any) => r?.[col] === val);
        return this;
      },
      in(col: string, vals: any[]) {
        this._filters.push((r: any) => vals.includes(r?.[col]));
        return this;
      },
      is() {
        return this;
      },
      order() {
        return this;
      },
      limit() {
        return this;
      },
      select() {
        return this;
      },
      _apply() {
        return this._rows.filter((r: any) => this._filters.every((f: any) => f(r)));
      },
      async maybeSingle() {
        return { data: this._apply()[0] ?? null, error: null };
      },
      then(resolve: any) {
        resolve({ data: this._apply(), error: null });
      },
    };
    return q;
  };

  return {
    from(table: string) {
      switch (table) {
        case "consent_records":
          return chain(handlers.consent_records ?? []);
        case "children":
          return chain(handlers.children ?? null);
        case "medications":
          return chain(handlers.medications ?? []);
        case "goals":
          return chain(handlers.goals ?? []);
        case "mood_logs":
          return chain(handlers.mood_logs ?? []);
        case "clinical_sessions":
          return chain(handlers.clinical_sessions ?? null);
        default:
          return chain([]);
      }
    },
  } as any;
}

describe("hasConsent", () => {
  const ctx = (supabase: any) => ({
    requesterId: "u1",
    subjectId: "c1",
    persona: "family",
    supabase,
  });

  it("retorna false sem client (fail closed)", async () => {
    expect(await hasConsent("child.diagnosis", { ...ctx(null) })).toBe(false);
  });

  it("retorna false quando não há registro (fail closed)", async () => {
    const sb = makeSupabase({ consent_records: [] });
    expect(await hasConsent("child.diagnosis", ctx(sb))).toBe(false);
  });

  it("retorna true quando há registro ativo", async () => {
    const sb = makeSupabase({
      consent_records: [{ scope: "ai_context", purpose: "child.diagnosis" }],
    });
    // maybeSingle é usada em hasConsent; o mock devolve a primeira linha.
    expect(await hasConsent("child.diagnosis", ctx(sb))).toBe(true);
  });
});

describe("buildContext", () => {
  it("sem supabase → bundle sem childProfile", async () => {
    const b = await buildContext({ persona: "family", requesterId: "u1", childId: "c1" });
    expect(b.childProfile).toBeUndefined();
  });

  it("sem consents → childProfile omitido (fail closed)", async () => {
    const sb = makeSupabase({
      consent_records: [], // nada consentido
      children: {
        full_name: "Ana Silva",
        birth_date: "2018-01-01",
        declared_conditions: ["TEA"],
      },
      medications: [{ name: "X", dose: "5mg", active: true }],
    });
    const b = await buildContext({
      persona: "family",
      requesterId: "u1",
      childId: "c1",
      supabase: sb,
    });
    expect(b.childProfile).toBeUndefined();
  });

  it("consent só de name → firstName presente, campos clínicos omitidos", async () => {
    const sb = makeSupabase({
      consent_records: [{ scope: "ai_context", purpose: "child.name" }],
      children: {
        full_name: "Ana Silva",
        declared_conditions: ["TEA"],
        dominant_interest: "dinossauros",
      },
      medications: [{ name: "Ritalina", dose: "10mg" }],
    });
    const b = await buildContext({
      persona: "family",
      requesterId: "u1",
      childId: "c1",
      supabase: sb,
    });
    expect(b.childProfile?.firstName).toBe("Ana");
    expect(b.childProfile?.diagnoses).toBeUndefined();
    expect(b.childProfile?.activeMedications).toBeUndefined();
    expect(b.childProfile?.dominantInterest).toBe("dinossauros");
  });

  it("respeita revogação — nova build com set vazio remove diagnósticos", async () => {
    const withConsent = makeSupabase({
      consent_records: [
        { scope: "ai_context", purpose: "child.name" },
        { scope: "ai_context", purpose: "child.diagnosis" },
      ],
      children: { id: "c1", full_name: "Ana", declared_conditions: ["TEA"] },
    });
    const first = await buildContext({
      persona: "family",
      requesterId: "u1",
      childId: "c1",
      supabase: withConsent,
    });
    expect(first.childProfile?.diagnoses).toEqual(["TEA"]);

    const revoked = makeSupabase({
      consent_records: [{ scope: "ai_context", purpose: "child.name" }],
      children: { id: "c1", full_name: "Ana", declared_conditions: ["TEA"] },
    });
    const second = await buildContext({
      persona: "family",
      requesterId: "u1",
      childId: "c1",
      supabase: revoked,
    });
    expect(second.childProfile?.diagnoses).toBeUndefined();
  });

  it("gate clínico: profissional sem clinical_share não recebe childProfile", async () => {
    const sb = makeSupabase({
      consent_records: [
        // consents granulares existem, mas o scope clinical_share está ausente
        { scope: "ai_context", purpose: "child.name" },
        { scope: "ai_context", purpose: "child.diagnosis" },
      ],
      children: { id: "c1", full_name: "Ana", declared_conditions: ["TEA"] },
    });
    const b = await buildContext({
      persona: "clinical",
      requesterId: "u1",
      childId: "c1",
      supabase: sb,
    });
    expect(b.childProfile).toBeUndefined();
  });
});

describe("serializeContext (persona child)", () => {
  it("omite campos clínicos mesmo se presentes no bundle", () => {
    const s = serializeContext({
      requesterId: "u1",
      requesterRole: "child",
      now: "2026-07-26T00:00:00Z",
      locale: "pt-BR",
      childProfile: {
        firstName: "Ana",
        ageYears: 8,
        dominantInterest: "dinossauros",
        diagnoses: ["TEA"],
        activeMedications: ["Ritalina 10mg"],
        activeGoals: ["Comunicação"],
        lastMoodTrend: "média 3.5",
        lastSessionSummary: "sessão SOAP...",
      },
    });
    expect(s).toContain("Ana");
    expect(s).toContain("dinossauros");
    expect(s).not.toContain("TEA");
    expect(s).not.toContain("Ritalina");
    expect(s).not.toContain("Comunicação");
    expect(s).not.toContain("SOAP");
    expect(s).not.toContain("média 3.5");
  });

  it("family recebe campos clínicos normalmente", () => {
    const s = serializeContext({
      requesterId: "u1",
      requesterRole: "family",
      now: "2026-07-26T00:00:00Z",
      locale: "pt-BR",
      childProfile: { firstName: "Ana", diagnoses: ["TEA"] },
    });
    expect(s).toContain("TEA");
  });
});

// Silencia console.warn dos fail-closed durante os testes.
vi.spyOn(console, "warn").mockImplementation(() => {});
