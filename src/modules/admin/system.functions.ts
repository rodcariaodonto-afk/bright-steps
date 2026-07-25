import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) {
    throw new Response("Forbidden", { status: 403 });
  }
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

// ============ USER MANAGEMENT ============

export const createUserAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      email: string;
      password: string;
      fullName?: string;
      roles?: string[];
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: data.fullName ? { full_name: data.fullName } : undefined,
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "Falha ao criar usuário");
    }

    if (data.roles && data.roles.length) {
      const rows = data.roles.map((role) => ({ user_id: created.user!.id, role }));
      await supabaseAdmin.from("user_roles").upsert(rows as any, {
        onConflict: "user_id,role",
      });
    }

    await audit(supabaseAdmin, context.userId, "user.create", "user", created.user.id, {
      email: data.email,
      roles: data.roles ?? [],
    });

    return { userId: created.user.id };
  });

export const inviteUserAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; roles?: string[] }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
    );
    if (error) throw new Error(error.message);

    if (invited.user && data.roles?.length) {
      const rows = data.roles.map((role) => ({ user_id: invited.user!.id, role }));
      await supabaseAdmin.from("user_roles").upsert(rows as any, {
        onConflict: "user_id,role",
      });
    }

    await audit(supabaseAdmin, context.userId, "user.invite", "user", invited.user?.id, {
      email: data.email,
      roles: data.roles ?? [],
    });

    return { userId: invited.user?.id ?? null };
  });

export const updateUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; roles: string[] }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (data.roles.length) {
      const rows = data.roles.map((role) => ({ user_id: data.userId, role }));
      const { error } = await supabaseAdmin.from("user_roles").insert(rows as any);
      if (error) throw new Error(error.message);
    }

    await audit(supabaseAdmin, context.userId, "user.roles.update", "user", data.userId, {
      roles: data.roles,
    });
    return { ok: true };
  });

export const suspendUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; hours: number }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) {
      throw new Error("Você não pode suspender a si mesmo.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: `${data.hours}h`,
    });
    if (error) throw new Error(error.message);

    await audit(supabaseAdmin, context.userId, "user.suspend", "user", data.userId, {
      hours: data.hours,
    });
    return { ok: true };
  });

export const unsuspendUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: "none",
    });
    if (error) throw new Error(error.message);

    await audit(supabaseAdmin, context.userId, "user.unsuspend", "user", data.userId);
    return { ok: true };
  });

export const deleteUserAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) {
      throw new Error("Você não pode excluir sua própria conta por aqui.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    await audit(supabaseAdmin, context.userId, "user.delete", "user", data.userId);
    return { ok: true };
  });

// ============ COMPLIMENTARY SUBSCRIPTIONS ============

export const grantComplimentary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      userId: string;
      plan: string;
      expiresAt?: string | null;
      reason?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("complimentary_subscriptions").insert({
      user_id: data.userId,
      plan: data.plan,
      granted_by: context.userId,
      expires_at: data.expiresAt ?? null,
      reason: data.reason ?? null,
    });
    if (error) throw new Error(error.message);

    await audit(
      supabaseAdmin,
      context.userId,
      "subscription.complimentary.grant",
      "user",
      data.userId,
      { plan: data.plan, expires_at: data.expiresAt ?? null, reason: data.reason ?? null },
    );
    return { ok: true };
  });

export const revokeComplimentary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("complimentary_subscriptions")
      .update({ revoked_at: new Date().toISOString(), revoked_by: context.userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await audit(
      supabaseAdmin,
      context.userId,
      "subscription.complimentary.revoke",
      "complimentary_subscription",
      data.id,
    );
    return { ok: true };
  });

export const listComplimentary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("complimentary_subscriptions")
      .select("id, user_id, plan, granted_by, reason, expires_at, revoked_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    const userIds = Array.from(
      new Set([
        ...(data ?? []).map((c: any) => c.user_id),
        ...(data ?? []).map((c: any) => c.granted_by),
      ]),
    );
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profs ?? []).map((p: any) => [p.id, p]));

    return (data ?? []).map((c: any) => ({
      ...c,
      user: map.get(c.user_id) ?? null,
      grantedBy: map.get(c.granted_by) ?? null,
    }));
  });

// ============ FEATURE FLAGS ============

export const listFeatureFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("feature_flags")
      .select("key, enabled, description, updated_at, updated_by")
      .order("key");
    if (error) throw error;
    return data ?? [];
  });

export const setFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string; enabled: boolean }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("feature_flags")
      .update({
        enabled: data.enabled,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      })
      .eq("key", data.key);
    if (error) throw new Error(error.message);
    await audit(supabaseAdmin, context.userId, "flag.set", "feature_flag", data.key, {
      enabled: data.enabled,
    });
    return { ok: true };
  });

// ============ APP SETTINGS ============

export const listAppSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("key, value, description, updated_at")
      .order("key");
    if (error) throw error;
    return data ?? [];
  });

export const updateAppSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string; value: unknown }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_settings")
      .update({
        value: data.value as any,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      })
      .eq("key", data.key);
    if (error) throw new Error(error.message);
    await audit(supabaseAdmin, context.userId, "setting.update", "app_setting", data.key, {
      value: data.value,
    });
    return { ok: true };
  });

// ============ AUDIT LOG ============

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("admin_audit_log")
      .select("id, actor_id, action, target_type, target_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (error) throw error;

    const actorIds = Array.from(new Set((rows ?? []).map((r: any) => r.actor_id)));
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", actorIds.length ? actorIds : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profs ?? []).map((p: any) => [p.id, p]));

    return (rows ?? []).map((r: any) => ({ ...r, actor: map.get(r.actor_id) ?? null }));
  });

// ============ BACKUPS / EXPORT ============

const EXPORTABLE_TABLES = [
  "profiles",
  "families",
  "family_members",
  "children",
  "child_guardians",
  "subscriptions",
  "complimentary_subscriptions",
  "professional_profiles",
  "clinical_sessions",
  "medications",
  "appointments",
  "routines",
  "goals",
  "reports",
  "notifications",
  "community_posts",
  "library_articles",
  "assessments",
  "user_roles",
  "admin_audit_log",
] as const;

export const listExportableTables = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const results = await Promise.all(
      EXPORTABLE_TABLES.map(async (t) => {
        const { count } = await supabaseAdmin
          .from(t as any)
          .select("*", { count: "exact", head: true });
        return { table: t, rows: count ?? 0 };
      }),
    );
    return results;
  });

export const exportTableCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { table: string }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    if (!(EXPORTABLE_TABLES as readonly string[]).includes(data.table)) {
      throw new Error("Tabela não permitida para exportação.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from(data.table as any).select("*");
    if (error) throw new Error(error.message);

    const list = (rows ?? []) as unknown as Record<string, unknown>[];
    if (list.length === 0) {
      await audit(supabaseAdmin, context.userId, "export.csv", "table", data.table, {
        rows: 0,
      });
      return { csv: "", rows: 0 };
    }

    const columns = Array.from(
      list.reduce((set, row) => {
        Object.keys(row).forEach((k) => set.add(k));
        return set;
      }, new Set<string>()),
    );
    const escape = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const str = typeof v === "object" ? JSON.stringify(v) : String(v);
      if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };
    const header = columns.join(",");
    const body = list.map((row) => columns.map((c) => escape(row[c])).join(",")).join("\n");
    const csv = `${header}\n${body}`;

    await audit(supabaseAdmin, context.userId, "export.csv", "table", data.table, {
      rows: list.length,
    });
    return { csv, rows: list.length };
  });
