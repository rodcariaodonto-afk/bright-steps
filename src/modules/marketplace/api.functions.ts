import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

// ------------- Helpers -------------
function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input as RequestInfo, { ...init, headers: h });
      },
    },
  });
}

async function ensureAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Response("Forbidden", { status: 403 });
}

const MARKETPLACE_COLUMNS =
  "id, user_id, slug, full_name, bio, photo_url, specialties, council_type, council_number, council_state, accepting_patients, city, state, modality, price_range, languages, average_rating, reviews_count, plan";

// ------------- Marketplace (public listing) -------------

export const listMarketplaceProfessionals = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("professional_profiles")
      .select(MARKETPLACE_COLUMNS)
      .eq("visible_in_marketplace", true)
      .eq("moderation_status", "approved")
      .order("plan", { ascending: false })
      .order("average_rating", { ascending: false })
      .order("full_name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
);

export const getProfessionalBySlug = createServerFn({ method: "GET" })
  .inputValidator((v: unknown) => z.object({ slug: z.string().min(1) }).parse(v))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: pro, error } = await supabase
      .from("professional_profiles")
      .select(
        "id, user_id, slug, full_name, bio, photo_url, specialties, council_type, council_number, council_state, accepting_patients, city, state, modality, price_range, languages, average_rating, reviews_count, plan, contact_email, contact_phone",
      )
      .eq("slug", data.slug)
      .eq("visible_in_marketplace", true)
      .eq("moderation_status", "approved")
      .maybeSingle();
    if (error) throw error;
    if (!pro) return null;

    const { data: reviews } = await supabase
      .from("professional_reviews")
      .select("id, author_user_id, rating, comment, created_at")
      .eq("professional_user_id", pro.user_id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50);

    return { ...pro, reviews: reviews ?? [] };
  });

// ------------- Own profile (professional) -------------

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
  full_name: z.string().min(2).max(120),
  bio: z.string().max(2000).optional().nullable(),
  photo_url: z.string().max(500).optional().nullable(),
  council_type: z.string().max(20).optional().nullable(),
  council_number: z.string().max(30).optional().nullable(),
  council_state: z.string().max(4).optional().nullable(),
  specialties: z.array(z.string()).default([]),
  city: z.string().max(80).optional().nullable(),
  state: z.string().max(4).optional().nullable(),
  modality: z.string().max(40).optional().nullable(),
  price_range: z.string().max(60).optional().nullable(),
  contact_email: z.string().max(120).optional().nullable(),
  contact_phone: z.string().max(30).optional().nullable(),
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

// ------------- Contact requests -------------

const contactSchema = z.object({
  professional_user_id: z.string().uuid(),
  child_id: z.string().uuid().optional().nullable(),
  message: z.string().min(5).max(1000),
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
    z
      .object({ id: z.string().uuid(), status: z.enum(["pending", "accepted", "declined"]) })
      .parse(v),
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

// ------------- Reviews -------------

const reviewSchema = z.object({
  professional_user_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1500).optional().nullable(),
});

export const submitProfessionalReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => reviewSchema.parse(v))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (userId === data.professional_user_id) {
      throw new Error("Você não pode avaliar a si mesmo");
    }
    const { error } = await supabase.from("professional_reviews").upsert(
      {
        professional_user_id: data.professional_user_id,
        author_user_id: userId,
        rating: data.rating,
        comment: data.comment ?? null,
        status: "published",
      },
      { onConflict: "professional_user_id,author_user_id" },
    );
    if (error) throw error;
    return { ok: true };
  });

export const deleteMyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("professional_reviews")
      .delete()
      .eq("id", data.id)
      .eq("author_user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

// ------------- Admin moderation -------------

export const listAdminProfessionalsFull = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("professional_profiles")
      .select(
        "id, user_id, slug, full_name, bio, council_type, council_number, council_state, specialties, moderation_status, rejection_reason, visible_in_marketplace, plan, average_rating, reviews_count, created_at, moderated_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    const ids = (data ?? []).map((p) => p.user_id);
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const pmap = new Map((profs ?? []).map((p) => [p.id, p]));
    return (data ?? []).map((p) => ({ ...p, account: pmap.get(p.user_id) ?? null }));
  });

export const moderateProfessional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected", "pending"]),
        rejection_reason: z.string().max(500).optional().nullable(),
        plan: z.enum(["free", "featured", "premium"]).optional(),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {
      moderation_status: data.status,
      moderated_at: new Date().toISOString(),
      moderated_by: context.userId,
      rejection_reason: data.status === "rejected" ? data.rejection_reason ?? null : null,
    };
    if (data.plan) patch.plan = data.plan;
    const { error } = await supabaseAdmin
      .from("professional_profiles")
      .update(patch)
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
