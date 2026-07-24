import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type NotificationKind =
  | "routine"
  | "medication"
  | "appointment"
  | "goal"
  | "achievement"
  | "message"
  | "system";

export type NotificationPriority = "critical" | "high" | "normal" | "low";

export interface NotificationInput {
  user_id: string;
  kind?: NotificationKind;
  title: string;
  body?: string | null;
  priority?: NotificationPriority;
  link?: string | null;
}

export async function listNotifications(
  limit = 50,
): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function countUnread(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function createNotification(
  input: NotificationInput,
): Promise<NotificationRow> {
  const { data, error } = await supabase
    .from("notifications")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllRead(): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}
