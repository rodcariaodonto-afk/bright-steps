import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMarketplaceProfessionals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("professional_profiles")
      .select(
        "id, user_id, full_name, bio, photo_url, specialties, council_id, accepting_patients, city, state, modality, price_range, contact_email, contact_phone, languages",
      )
      .eq("visible_in_marketplace", true)
      .order("full_name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const getMyProfessionalProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("professional_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

const profileSchema = z.object({
  full_name: z.string().min(2),
  bio: z.string().optional().nullable(),
  photo_url: z.string().optional().nullable(),
  council_id: z.string().optional().nullable(),
  specialties: z.array(z.string()).default([]),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  modality: z.string().optional().nullable(),
  price_range: z.string().optional().nullable(),
  contact_email: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  languages: z.array(z.string()).default(["pt-BR"]),
  accepting_patients: z.boolean().default(false),
  visible_in_marketplace: z.boolean().default(false),
});

export const upsertMyProfessionalProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => profileSchema.parse(v))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("professional_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("professional_profiles")
        .update(data)
        .eq("user_id", userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("professional_profiles")
        .insert({ ...data, user_id: userId });
      if (error) throw error;
    }
    return { ok: true };
  });

const contactSchema = z.object({
  professional_user_id: z.string().uuid(),
  child_id: z.string().uuid().optional().nullable(),
  message: z.string().min(5),
});

export const requestProfessionalContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => contactSchema.parse(v))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("professional_contact_requests").insert({
      professional_user_id: data.professional_user_id,
      requester_user_id: userId,
      child_id: data.child_id ?? null,
      message: data.message,
    });
    if (error) throw error;
    return { ok: true };
  });

export const listMyContactRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("professional_contact_requests")
      .select("id, professional_user_id, child_id, message, status, created_at")
      .eq("requester_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listIncomingContactRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("professional_contact_requests")
      .select("id, requester_user_id, child_id, message, status, created_at")
      .eq("professional_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const reqIds = Array.from(new Set((data ?? []).map((r) => r.requester_user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", reqIds.length ? reqIds : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (data ?? []).map((r) => ({ ...r, requester: map.get(r.requester_user_id) ?? null }));
  });

export const updateContactRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "accepted", "declined"]) }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("professional_contact_requests")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("professional_user_id", userId);
    if (error) throw error;
    return { ok: true };
  });
