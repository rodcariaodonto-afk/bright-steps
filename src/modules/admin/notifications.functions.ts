import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Response("Forbidden", { status: 403 });
}

export const listAllNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("id, user_id, title, body, kind, priority, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const ids = Array.from(new Set((data ?? []).map((n) => n.user_id)));
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profs ?? []).map((p) => [p.id, p]));

    return (data ?? []).map((n) => ({
      ...n,
      recipient: map.get(n.user_id) ?? null,
    }));
  });

export const broadcastNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      title: string;
      body?: string;
      kind?: string;
      priority?: string;
      link?: string;
      audience: "all" | "admin" | "professional" | "family";
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userIds: string[] = [];
    if (data.audience === "all" || data.audience === "family") {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id");
      userIds = (profs ?? []).map((p: any) => p.id);
      if (data.audience === "family") {
        const { data: nonFamily } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .in("role", ["admin", "professional"] as any);
        const exclude = new Set((nonFamily ?? []).map((r: any) => r.user_id));
        userIds = userIds.filter((id) => !exclude.has(id));
      }
    } else {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", data.audience as any);
      userIds = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
    }

    if (!userIds.length) return { sent: 0 };

    const rows = userIds.map((uid) => ({
      user_id: uid,
      title: data.title,
      body: data.body ?? null,
      kind: data.kind ?? "system",
      priority: data.priority ?? "normal",
      link: data.link ?? null,
    }));

    // insert in chunks of 500
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await supabaseAdmin.from("notifications").insert(chunk);
      if (error) throw error;
      inserted += chunk.length;
    }

    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "broadcast_notification",
      target_type: "notifications",
      metadata: { audience: data.audience, count: inserted, title: data.title },
    });

    return { sent: inserted };
  });

export const deleteAdminNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("notifications").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
