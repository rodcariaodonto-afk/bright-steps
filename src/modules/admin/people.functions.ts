import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Response("Forbidden", { status: 403 });
}

async function audit(
  adminClient: any,
  actorId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  await adminClient.from("admin_audit_log").insert({
    actor_id: actorId,
    action,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
    metadata: metadata ?? null,
  });
}

async function findOrCreateUser(
  supabaseAdmin: any,
  email: string,
  fullName?: string,
  password?: string,
) {
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name")
    .ilike("email", email)
    .maybeSingle();
  if (existing) return { id: existing.id, created: false };

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: password ?? crypto.randomUUID().slice(0, 12) + "!Aa1",
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });
  if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar usuário");
  return { id: created.user.id, created: true };
}

// ============ PROFESSIONAL ============
export const createProfessionalAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      email: string;
      full_name: string;
      council_type?: string;
      council_number?: string;
      council_state?: string;
      specialties?: string[];
      bio?: string;
      city?: string;
      state?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { id: userId } = await findOrCreateUser(supabaseAdmin, data.email, data.full_name);

    // profile row
    await supabaseAdmin.from("profiles").upsert(
      { id: userId, email: data.email, full_name: data.full_name },
      { onConflict: "id" },
    );

    const { data: pro, error } = await supabaseAdmin
      .from("professional_profiles")
      .upsert(
        {
          user_id: userId,
          full_name: data.full_name,
          council_type: data.council_type ?? null,
          council_number: data.council_number ?? null,
          council_state: data.council_state ?? null,
          specialties: data.specialties ?? [],
          bio: data.bio ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          moderation_status: "approved",
          moderated_at: new Date().toISOString(),
          moderated_by: context.userId,
          visible_in_marketplace: true,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();
    if (error) throw error;

    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: "professional" as any },
      { onConflict: "user_id,role" },
    );

    await audit(supabaseAdmin, context.userId, "create_professional", "professional_profiles", pro.id, {
      email: data.email,
    });

    return { ok: true, id: pro.id };
  });

// ============ FAMILY ============
export const createFamilyAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { name: string; owner_email: string; timezone?: string }) => input,
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: owner } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", data.owner_email)
      .maybeSingle();
    if (!owner) throw new Error("Responsável (owner) não encontrado. Cadastre o usuário primeiro.");

    const { data: fam, error } = await supabaseAdmin
      .from("families")
      .insert({
        name: data.name,
        owner_id: owner.id,
        timezone: data.timezone ?? "America/Sao_Paulo",
      })
      .select()
      .single();
    if (error) throw error;

    await audit(supabaseAdmin, context.userId, "create_family", "families", fam.id);
    return { ok: true, id: fam.id };
  });

// ============ CHILD ============
export const createChildAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      family_id: string;
      full_name: string;
      nickname?: string;
      birth_date?: string;
      declared_conditions?: string[];
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: child, error } = await supabaseAdmin
      .from("children")
      .insert({
        family_id: data.family_id,
        full_name: data.full_name,
        nickname: data.nickname ?? null,
        birth_date: data.birth_date ?? null,
        declared_conditions: data.declared_conditions ?? [],
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw error;

    await audit(supabaseAdmin, context.userId, "create_child", "children", child.id);
    return { ok: true, id: child.id };
  });

// ============ SCHOOL ============
export const createSchoolAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      child_id: string;
      name: string;
      grade?: string;
      class_name?: string;
      teacher_name?: string;
      teacher_email?: string;
      phone?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: school, error } = await supabaseAdmin
      .from("school_profiles")
      .insert({
        child_id: data.child_id,
        name: data.name,
        grade: data.grade ?? null,
        class_name: data.class_name ?? null,
        teacher_name: data.teacher_name ?? null,
        teacher_email: data.teacher_email ?? null,
        phone: data.phone ?? null,
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw error;

    await audit(supabaseAdmin, context.userId, "create_school", "school_profiles", school.id);
    return { ok: true, id: school.id };
  });

// ============ Helpers para popular selects ============
export const listAllFamiliesLite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("families")
      .select("id, name")
      .is("deleted_at", null)
      .order("name")
      .limit(500);
    return data ?? [];
  });

export const listAllChildrenLite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("children")
      .select("id, full_name")
      .is("deleted_at", null)
      .order("full_name")
      .limit(500);
    return data ?? [];
  });
