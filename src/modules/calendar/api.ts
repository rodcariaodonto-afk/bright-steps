import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

export type CalendarSource = "event" | "appointment";

export interface UnifiedEvent {
  id: string;
  source: CalendarSource;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location?: string | null;
  color?: string | null;
  category?: string;
  childId?: string | null;
  status?: string;
}

export interface CalendarEventInput {
  family_id: string;
  child_id?: string | null;
  title: string;
  description?: string | null;
  category?: string;
  starts_at: string;
  ends_at: string;
  all_day?: boolean;
  location?: string | null;
  color?: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "#3b82f6",
  therapy: "#0ea5e9",
  medical: "#ef4444",
  school: "#f59e0b",
  family: "#22c55e",
  other: "#8b5cf6",
};

export function eventColor(ev: UnifiedEvent): string {
  if (ev.color) return ev.color;
  if (ev.source === "appointment") return "#0ea5e9";
  return CATEGORY_COLORS[ev.category ?? "general"] ?? CATEGORY_COLORS.general;
}

export async function listCalendarEvents(
  familyId: string,
  fromISO: string,
  toISO: string,
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("family_id", familyId)
    .gte("starts_at", fromISO)
    .lte("starts_at", toISO)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listAppointmentsForChildren(
  childIds: string[],
  fromISO: string,
  toISO: string,
): Promise<Appointment[]> {
  if (childIds.length === 0) return [];
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .in("child_id", childIds)
    .gte("starts_at", fromISO)
    .lte("starts_at", toISO)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listUnifiedEvents(
  familyId: string,
  childIds: string[],
  fromISO: string,
  toISO: string,
): Promise<UnifiedEvent[]> {
  const [events, appts] = await Promise.all([
    listCalendarEvents(familyId, fromISO, toISO),
    listAppointmentsForChildren(childIds, fromISO, toISO),
  ]);

  const evUnified: UnifiedEvent[] = events.map((e) => ({
    id: `ev:${e.id}`,
    source: "event",
    title: e.title,
    description: e.description,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    allDay: e.all_day,
    location: e.location,
    color: e.color,
    category: e.category,
    childId: e.child_id,
  }));

  const apUnified: UnifiedEvent[] = appts.map((a) => ({
    id: `ap:${a.id}`,
    source: "appointment",
    title: a.modality ? `Sessão: ${a.modality}` : "Sessão clínica",
    description: a.notes,
    startsAt: a.starts_at,
    endsAt: a.ends_at,
    allDay: false,
    location: a.location,
    category: "therapy",
    childId: a.child_id,
    status: a.status,
  }));

  return [...evUnified, ...apUnified].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
}

export async function createCalendarEvent(
  input: CalendarEventInput,
  createdBy: string,
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from("calendar_events")
    .insert({ ...input, created_by: createdBy })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCalendarEvent(
  id: string,
  patch: Partial<CalendarEventInput>,
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from("calendar_events")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) throw error;
}
