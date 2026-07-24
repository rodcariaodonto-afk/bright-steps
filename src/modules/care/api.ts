import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Routine = Database["public"]["Tables"]["routines"]["Row"];
export type RoutineInput = Database["public"]["Tables"]["routines"]["Insert"];
export type RoutineCompletion =
  Database["public"]["Tables"]["routine_completions"]["Row"];

export type Medication = Database["public"]["Tables"]["medications"]["Row"];
export type MedicationInput =
  Database["public"]["Tables"]["medications"]["Insert"];
export type MedicationLog =
  Database["public"]["Tables"]["medication_logs"]["Row"];

export type MoodLog = Database["public"]["Tables"]["mood_logs"]["Row"];
export type MoodLogInput = Database["public"]["Tables"]["mood_logs"]["Insert"];

export type BehaviorEvent =
  Database["public"]["Tables"]["behavior_events"]["Row"];
export type BehaviorEventInput =
  Database["public"]["Tables"]["behavior_events"]["Insert"];

// -------- Routines --------
export async function listRoutines(childId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from("routines")
    .select("*")
    .eq("child_id", childId)
    .eq("is_active", true)
    .order("time_of_day", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRoutine(input: RoutineInput): Promise<Routine> {
  const { data, error } = await supabase
    .from("routines")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function archiveRoutine(id: string): Promise<void> {
  const { error } = await supabase
    .from("routines")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function toggleRoutineCompletion(
  routine: Routine,
  date: string,
  done: boolean,
): Promise<void> {
  if (done) {
    const { error } = await supabase.from("routine_completions").upsert(
      {
        routine_id: routine.id,
        child_id: routine.child_id,
        completed_on: date,
        status: "done",
      },
      { onConflict: "routine_id,completed_on" },
    );
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("routine_completions")
      .delete()
      .eq("routine_id", routine.id)
      .eq("completed_on", date);
    if (error) throw error;
  }
}

export async function listCompletionsForDate(
  childId: string,
  date: string,
): Promise<RoutineCompletion[]> {
  const { data, error } = await supabase
    .from("routine_completions")
    .select("*")
    .eq("child_id", childId)
    .eq("completed_on", date);
  if (error) throw error;
  return data ?? [];
}

// -------- Medications --------
export async function listMedications(childId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("child_id", childId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMedication(
  input: MedicationInput,
): Promise<Medication> {
  const { data, error } = await supabase
    .from("medications")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function archiveMedication(id: string): Promise<void> {
  const { error } = await supabase
    .from("medications")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function logMedication(input: {
  medication_id: string;
  child_id: string;
  status?: string;
  dose_taken?: string | null;
  note?: string | null;
}): Promise<MedicationLog> {
  const { data, error } = await supabase
    .from("medication_logs")
    .insert({
      medication_id: input.medication_id,
      child_id: input.child_id,
      status: input.status ?? "taken",
      dose_taken: input.dose_taken ?? null,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function recentMedicationLogs(
  childId: string,
  limit = 20,
): Promise<MedicationLog[]> {
  const { data, error } = await supabase
    .from("medication_logs")
    .select("*")
    .eq("child_id", childId)
    .order("taken_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// -------- Mood --------
export async function listMoodLogs(
  childId: string,
  limit = 30,
): Promise<MoodLog[]> {
  const { data, error } = await supabase
    .from("mood_logs")
    .select("*")
    .eq("child_id", childId)
    .order("logged_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createMoodLog(input: MoodLogInput): Promise<MoodLog> {
  const { data, error } = await supabase
    .from("mood_logs")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// -------- Behavior --------
export async function listBehaviorEvents(
  childId: string,
  limit = 30,
): Promise<BehaviorEvent[]> {
  const { data, error } = await supabase
    .from("behavior_events")
    .select("*")
    .eq("child_id", childId)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createBehaviorEvent(
  input: BehaviorEventInput,
): Promise<BehaviorEvent> {
  const { data, error } = await supabase
    .from("behavior_events")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// -------- Timeline (aggregation) --------
export type TimelineEntry = {
  id: string;
  kind: "mood" | "medication" | "behavior" | "routine";
  at: string;
  title: string;
  description?: string | null;
  meta?: Record<string, unknown>;
};

export async function loadTimeline(
  childId: string,
  limit = 40,
): Promise<TimelineEntry[]> {
  const [moods, meds, behs, comps] = await Promise.all([
    listMoodLogs(childId, limit),
    recentMedicationLogs(childId, limit),
    listBehaviorEvents(childId, limit),
    supabase
      .from("routine_completions")
      .select("*, routines(title)")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);
  const entries: TimelineEntry[] = [];
  for (const m of moods) {
    entries.push({
      id: `mood-${m.id}`,
      kind: "mood",
      at: m.logged_at,
      title: `Humor ${m.level}/5 ${m.emoji ?? ""}`.trim(),
      description: m.note,
    });
  }
  for (const l of meds) {
    entries.push({
      id: `med-${l.id}`,
      kind: "medication",
      at: l.taken_at,
      title: `Medicação registrada (${l.status})`,
      description: l.note,
    });
  }
  for (const b of behs) {
    entries.push({
      id: `beh-${b.id}`,
      kind: "behavior",
      at: b.occurred_at,
      title: `Comportamento: ${b.category}${b.intensity ? ` (int. ${b.intensity}/5)` : ""}`,
      description: b.behavior ?? b.note,
    });
  }
  for (const c of (comps.data ?? []) as Array<
    RoutineCompletion & { routines: { title: string } | null }
  >) {
    entries.push({
      id: `rc-${c.id}`,
      kind: "routine",
      at: c.created_at,
      title: `Rotina: ${c.routines?.title ?? "atividade"} — ${c.status}`,
      description: c.note,
    });
  }
  entries.sort((a, b) => (a.at < b.at ? 1 : -1));
  return entries.slice(0, limit);
}
