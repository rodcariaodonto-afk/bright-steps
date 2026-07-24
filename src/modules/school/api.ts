import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SchoolProfile =
  Database["public"]["Tables"]["school_profiles"]["Row"];
export type SchoolProfileInput =
  Database["public"]["Tables"]["school_profiles"]["Insert"];

export type SchoolNote = Database["public"]["Tables"]["school_notes"]["Row"];
export type SchoolNoteInput =
  Database["public"]["Tables"]["school_notes"]["Insert"];

export type SchoolNoteCategory =
  | "comunicado"
  | "comportamento"
  | "elogio"
  | "ocorrencia"
  | "tarefa"
  | "reuniao"
  | "outro";

// ---------- Schools ----------
export async function listSchools(childId: string): Promise<SchoolProfile[]> {
  const { data, error } = await supabase
    .from("school_profiles")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSchool(
  input: SchoolProfileInput,
): Promise<SchoolProfile> {
  const { data, error } = await supabase
    .from("school_profiles")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSchool(id: string): Promise<void> {
  const { error } = await supabase.from("school_profiles").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Notes ----------
export async function listNotes(
  childId: string,
  schoolId?: string | null,
): Promise<SchoolNote[]> {
  let q = supabase
    .from("school_notes")
    .select("*")
    .eq("child_id", childId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (schoolId) q = q.eq("school_id", schoolId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createNote(input: SchoolNoteInput): Promise<SchoolNote> {
  const { data, error } = await supabase
    .from("school_notes")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function togglePinNote(
  id: string,
  pinned: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("school_notes")
    .update({ pinned })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("school_notes").delete().eq("id", id);
  if (error) throw error;
}
