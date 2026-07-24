import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Family = Database["public"]["Tables"]["families"]["Row"];
export type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"];
export type Child = Database["public"]["Tables"]["children"]["Row"];
export type FamilyRole = Database["public"]["Enums"]["family_role"];
export type ChildPronouns = Database["public"]["Enums"]["child_pronouns"];

export interface ChildInput {
  full_name: string;
  nickname?: string | null;
  birth_date?: string | null;
  pronouns?: ChildPronouns | null;
  declared_conditions?: string[];
  dominant_interest?: string | null;
  notes?: string | null;
}

/**
 * Retorna a família do usuário logado. Cria uma automaticamente se não existir.
 * Toda pessoa que loga na área família tem exatamente uma família como "dono"
 * (pode participar de outras como membro convidado).
 */
export async function ensureFamily(userId: string, displayName: string | null): Promise<Family> {
  // Já é dono de alguma?
  const { data: owned, error: ownedErr } = await supabase
    .from("families")
    .select("*")
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1);
  if (ownedErr) throw ownedErr;
  if (owned && owned.length > 0) return owned[0];

  // Cria nova família
  const familyName = displayName ? `Família ${displayName.split(" ")[0]}` : "Minha família";
  const { data: created, error: createErr } = await supabase
    .from("families")
    .insert({ name: familyName, owner_id: userId })
    .select()
    .single();
  if (createErr) throw createErr;

  // Registra o dono também como membro
  await supabase.from("family_members").insert({
    family_id: created.id,
    user_id: userId,
    role: "owner",
    status: "active",
    accepted_at: new Date().toISOString(),
  });

  return created;
}

export async function listMyFamilies(): Promise<Family[]> {
  const { data, error } = await supabase
    .from("families")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateFamily(id: string, patch: Partial<Pick<Family, "name" | "timezone">>) {
  const { data, error } = await supabase
    .from("families")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listMembers(familyId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function inviteMember(
  familyId: string,
  email: string,
  role: FamilyRole,
  invitedBy: string,
) {
  const { data, error } = await supabase
    .from("family_members")
    .insert({
      family_id: familyId,
      invited_email: email.toLowerCase().trim(),
      role,
      status: "invited",
      invited_by: invitedBy,
      invited_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeMember(memberId: string) {
  const { error } = await supabase.from("family_members").delete().eq("id", memberId);
  if (error) throw error;
}

export async function listChildren(familyId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("family_id", familyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listAllAccessibleChildren(): Promise<Child[]> {
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createChild(
  familyId: string,
  userId: string,
  input: ChildInput,
): Promise<Child> {
  const { data, error } = await supabase
    .from("children")
    .insert({
      family_id: familyId,
      created_by: userId,
      full_name: input.full_name,
      nickname: input.nickname ?? null,
      birth_date: input.birth_date ?? null,
      pronouns: input.pronouns ?? null,
      declared_conditions: input.declared_conditions ?? [],
      dominant_interest: input.dominant_interest ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  // Cria vínculo de guarda para o próprio criador (admin da criança)
  await supabase.from("child_guardians").insert({
    child_id: data.id,
    user_id: userId,
    permission: "admin",
    granted_by: userId,
  });

  return data;
}

export async function updateChild(id: string, patch: Partial<ChildInput>): Promise<Child> {
  const { data, error } = await supabase
    .from("children")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteChild(id: string) {
  const { error } = await supabase
    .from("children")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function uploadChildAvatar(
  childId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${childId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("children")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = await supabase.storage.from("children").createSignedUrl(path, 60 * 60 * 24 * 365);
  const url = data?.signedUrl ?? path;
  await updateChild(childId, { avatar_url: url } as Partial<ChildInput> & { avatar_url: string });
  return url;
}
