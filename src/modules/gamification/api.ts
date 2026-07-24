import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type KidRewards = Database["public"]["Tables"]["kid_rewards"]["Row"];
export type KidAchievement =
  Database["public"]["Tables"]["kid_achievements"]["Row"];
export type KidRewardLog =
  Database["public"]["Tables"]["kid_reward_log"]["Row"];

export async function getRewards(childId: string): Promise<KidRewards | null> {
  const { data, error } = await supabase
    .from("kid_rewards")
    .select("*")
    .eq("child_id", childId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function addStars(
  childId: string,
  delta: number,
  reason: string,
  source: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("add_kid_stars", {
    _child_id: childId,
    _delta: delta,
    _reason: reason,
    _source: source,
  });
  if (error) throw error;
  return data as number;
}

export async function listAchievements(
  childId: string,
): Promise<KidAchievement[]> {
  const { data, error } = await supabase
    .from("kid_achievements")
    .select("*")
    .eq("child_id", childId)
    .order("unlocked_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function unlockAchievement(input: {
  child_id: string;
  code: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  category?: string | null;
  stars_earned?: number;
}): Promise<KidAchievement | null> {
  const { data, error } = await supabase
    .from("kid_achievements")
    .insert({
      child_id: input.child_id,
      code: input.code,
      title: input.title,
      description: input.description ?? null,
      icon: input.icon ?? null,
      category: input.category ?? null,
      stars_earned: input.stars_earned ?? 0,
    })
    .select()
    .maybeSingle();
  // 23505 = unique violation (já desbloqueada) — ignorar
  if (error && error.code !== "23505") throw error;
  if (input.stars_earned && input.stars_earned > 0 && !error) {
    await addStars(
      input.child_id,
      input.stars_earned,
      `Conquista: ${input.title}`,
      "achievement",
    );
  }
  return data ?? null;
}

export async function listRewardLog(
  childId: string,
  limit = 30,
): Promise<KidRewardLog[]> {
  const { data, error } = await supabase
    .from("kid_reward_log")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
