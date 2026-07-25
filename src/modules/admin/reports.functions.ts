import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Response("Forbidden", { status: 403 });
}

export const listAdminReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reports")
      .select("id, title, kind, summary, period_start, period_end, ai_generated, child_id, created_at, created_by")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

function toCsv(rows: Record<string, any>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v == null) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export const exportPlatformReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      rangeDays: number;
      type: "users" | "families" | "professionals" | "subscriptions" | "sessions";
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date();
    since.setDate(since.getDate() - data.rangeDays);
    const sinceIso = since.toISOString();

    let rows: any[] = [];
    if (data.type === "users") {
      const { data: r } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, created_at")
        .gte("created_at", sinceIso);
      rows = r ?? [];
    } else if (data.type === "families") {
      const { data: r } = await supabaseAdmin
        .from("families")
        .select("id, name, owner_id, timezone, created_at")
        .gte("created_at", sinceIso);
      rows = r ?? [];
    } else if (data.type === "professionals") {
      const { data: r } = await supabaseAdmin
        .from("professional_profiles")
        .select("id, full_name, council_type, council_number, council_state, moderation_status, created_at");
      rows = r ?? [];
    } else if (data.type === "subscriptions") {
      const { data: r } = await supabaseAdmin
        .from("subscriptions")
        .select("id, user_id, status, product_id, price_id, environment, current_period_end, created_at");
      rows = r ?? [];
    } else if (data.type === "sessions") {
      const { data: r } = await supabaseAdmin
        .from("clinical_sessions")
        .select("id, child_id, duration_minutes, created_at")
        .gte("created_at", sinceIso);
      rows = r ?? [];
    }

    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "export_report",
      target_type: data.type,
      metadata: { rangeDays: data.rangeDays, count: rows.length },
    });

    return { csv: toCsv(rows), count: rows.length };
  });
