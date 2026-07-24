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

export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [profiles, families, children, professionals, sessions, notifications, rewards] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("families")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null),
        supabaseAdmin
          .from("children")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null),
        supabaseAdmin
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "professional"),
        supabaseAdmin.from("clinical_sessions").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("notifications").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("kid_rewards").select("lifetime_stars"),
      ]);

    const lifetimeStars =
      rewards.data?.reduce((acc: number, r: any) => acc + (r.lifetime_stars ?? 0), 0) ?? 0;

    // signups últimos 7 dias
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const { count: newUsers7d } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since.toISOString());

    return {
      totalUsers: profiles.count ?? 0,
      newUsers7d: newUsers7d ?? 0,
      families: families.count ?? 0,
      children: children.count ?? 0,
      professionals: professionals.count ?? 0,
      sessions: sessions.count ?? 0,
      notifications: notifications.count ?? 0,
      lifetimeStars,
    };
  });

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const ids = (profiles ?? []).map((p) => p.id);
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    });

    return (profiles ?? []).map((p) => ({
      ...p,
      roles: rolesByUser.get(p.id) ?? [],
    }));
  });

export const listAdminFamilies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("families")
      .select("id, name, owner_id, created_at, deleted_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const ownerIds = Array.from(new Set((data ?? []).map((f) => f.owner_id)));
    const { data: owners } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ownerIds.length ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);
    const ownerMap = new Map((owners ?? []).map((o) => [o.id, o]));

    const familyIds = (data ?? []).map((f) => f.id);
    const { data: children } = await supabaseAdmin
      .from("children")
      .select("id, family_id")
      .in("family_id", familyIds.length ? familyIds : ["00000000-0000-0000-0000-000000000000"])
      .is("deleted_at", null);
    const countByFamily = new Map<string, number>();
    (children ?? []).forEach((c: any) => {
      countByFamily.set(c.family_id, (countByFamily.get(c.family_id) ?? 0) + 1);
    });

    return (data ?? []).map((f) => ({
      ...f,
      owner: ownerMap.get(f.owner_id) ?? null,
      childrenCount: countByFamily.get(f.id) ?? 0,
    }));
  });

export const listAdminChildren = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("children")
      .select("id, full_name, nickname, birth_date, family_id, created_at, declared_conditions")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });
