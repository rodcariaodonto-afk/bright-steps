import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Question = { id: string; text: string; risk: "yes" | "no" };
type ScoringBand = { max: number; label: string };
type Scoring = { type: "count_risk"; bands: ScoringBand[] };

export const listAssessments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("assessments")
      .select("id, slug, name, description, audience, age_min_months, age_max_months, disclaimer")
      .eq("published", true)
      .order("name");
    if (error) throw error;
    return data ?? [];
  });

export const getAssessment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("assessments")
      .select("id, slug, name, description, audience, questions, scoring, disclaimer")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    return row;
  });

export const submitAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        assessmentId: z.string().uuid(),
        childId: z.string().uuid().optional().nullable(),
        answers: z.record(z.string(), z.enum(["yes", "no"])),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .select("questions, scoring")
      .eq("id", data.assessmentId)
      .maybeSingle();
    if (aErr || !assessment) throw new Error("assessment not found");

    const questions = (assessment.questions as unknown as Question[]) ?? [];
    const scoring = (assessment.scoring as unknown as Scoring) ?? { type: "count_risk", bands: [] };
    let score = 0;
    for (const q of questions) {
      const ans = data.answers[q.id];
      if (ans && ans === q.risk) score += 1;
    }
    const band = [...scoring.bands].sort((a, b) => a.max - b.max).find((b) => score <= b.max)?.label ?? "Sem faixa";

    const { data: inserted, error } = await supabase
      .from("assessment_responses")
      .insert({
        assessment_id: data.assessmentId,
        child_id: data.childId ?? null,
        respondent_id: userId,
        answers: data.answers,
        score,
        band,
      })
      .select("id, score, band")
      .single();
    if (error) throw error;
    return inserted;
  });

export const listMyResponses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("assessment_responses")
      .select("id, score, band, created_at, assessment_id, child_id, assessments(name, slug)")
      .eq("respondent_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });

// ============ CAREGIVER MOOD ============
export const logCaregiverMood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        mood: z.number().int().min(1).max(5),
        stress: z.number().int().min(1).max(5).optional(),
        sleep_hours: z.number().min(0).max(24).optional(),
        note: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("caregiver_mood_logs").insert({
      user_id: context.userId,
      mood: data.mood,
      stress: data.stress ?? null,
      sleep_hours: data.sleep_hours ?? null,
      note: data.note ?? null,
    });
    if (error) throw error;
    return { ok: true };
  });

export const listCaregiverMood = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("caregiver_mood_logs")
      .select("id, mood, stress, sleep_hours, note, logged_at")
      .eq("user_id", context.userId)
      .order("logged_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return data ?? [];
  });
