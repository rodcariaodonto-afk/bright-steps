import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type GoalInput = Database["public"]["Tables"]["goals"]["Insert"];
export type GoalProgress =
  Database["public"]["Tables"]["goal_progress"]["Row"];
export type GoalProgressInput =
  Database["public"]["Tables"]["goal_progress"]["Insert"];

export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportInput = Database["public"]["Tables"]["reports"]["Insert"];

// ---------- Goals ----------
export async function listGoals(childId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listGoalProgress(goalId: string): Promise<GoalProgress[]> {
  const { data, error } = await supabase
    .from("goal_progress")
    .select("*")
    .eq("goal_id", goalId)
    .order("logged_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function createGoal(input: Omit<GoalInput, "created_by">) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sessão expirada");
  const { data, error } = await supabase
    .from("goals")
    .insert({ ...input, created_by: auth.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGoalStatus(id: string, status: string) {
  const { error } = await supabase
    .from("goals")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}

export async function logGoalProgress(
  input: Omit<GoalProgressInput, "logged_by">,
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sessão expirada");
  const { data, error } = await supabase
    .from("goal_progress")
    .insert({ ...input, logged_by: auth.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------- Reports ----------
export async function listReports(childId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("child_id", childId)
    .order("period_end", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

export async function createReport(input: Omit<ReportInput, "created_by">) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sessão expirada");
  const { data, error } = await supabase
    .from("reports")
    .insert({ ...input, created_by: auth.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReport(id: string) {
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) throw error;
}
