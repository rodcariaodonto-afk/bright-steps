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

// ============ MARKETPLACE ============

export const listMarketplaceProfessionals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: string; search?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("professional_profiles")
      .select(
        "id, user_id, full_name, council_type, council_number, council_state, specialties, moderation_status, average_rating, reviews_count, visible_in_marketplace, city, state, contact_email, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (data.status && data.status !== "all") {
      query = query.eq("moderation_status", data.status);
    }
    if (data.search) {
      query = query.ilike("full_name", `%${data.search}%`);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const { count: approved } = await supabaseAdmin
      .from("professional_profiles")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "approved");
    const { count: pending } = await supabaseAdmin
      .from("professional_profiles")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "pending");
    const { count: rejected } = await supabaseAdmin
      .from("professional_profiles")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "rejected");

    return {
      items: rows ?? [],
      metrics: {
        approved: approved ?? 0,
        pending: pending ?? 0,
        rejected: rejected ?? 0,
      },
    };
  });

export const moderateProfessional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { id: string; status: "approved" | "rejected" | "pending"; reason?: string }) => input,
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("professional_profiles")
      .update({
        moderation_status: data.status,
        moderated_at: new Date().toISOString(),
        moderated_by: context.userId,
        rejection_reason: data.status === "rejected" ? data.reason ?? null : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(supabaseAdmin, context.userId, "professional.moderate", "professional", data.id, {
      status: data.status,
    });
    return { ok: true };
  });

export const toggleProfessionalVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; visible: boolean }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("professional_profiles")
      .update({ visible_in_marketplace: data.visible })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(supabaseAdmin, context.userId, "professional.visibility", "professional", data.id, {
      visible: data.visible,
    });
    return { ok: true };
  });

// ============ COMMUNITY ============

export const listCommunityPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: string; search?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("community_posts")
      .select("id, author_id, title, body, topic, status, likes_count, comments_count, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    if (data.search) query = query.ilike("title", `%${data.search}%`);

    const { data: posts, error } = await query;
    if (error) throw new Error(error.message);

    const authorIds = Array.from(new Set((posts ?? []).map((p) => p.author_id)));
    const authorsMap: Record<string, { full_name: string | null; email: string | null }> = {};
    if (authorIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", authorIds);
      for (const p of profs ?? []) {
        authorsMap[p.id] = { full_name: p.full_name, email: p.email };
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: postsToday } = await supabaseAdmin
      .from("community_posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today.toISOString());
    const { count: commentsToday } = await supabaseAdmin
      .from("community_comments")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today.toISOString());
    const { count: totalPosts } = await supabaseAdmin
      .from("community_posts")
      .select("id", { count: "exact", head: true });

    return {
      items: (posts ?? []).map((p) => ({ ...p, author: authorsMap[p.author_id] ?? null })),
      metrics: {
        postsToday: postsToday ?? 0,
        commentsToday: commentsToday ?? 0,
        totalPosts: totalPosts ?? 0,
      },
    };
  });

export const moderateCommunityPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; action: "hide" | "publish" | "delete" }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.action === "delete") {
      const { error } = await supabaseAdmin.from("community_posts").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const newStatus = data.action === "hide" ? "hidden" : "published";
      const { error } = await supabaseAdmin
        .from("community_posts")
        .update({ status: newStatus })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    await audit(supabaseAdmin, context.userId, `community.${data.action}`, "post", data.id);
    return { ok: true };
  });

// ============ FINANCE ============

export const getFinanceMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { PUBLIC_PLANS } = await import("@/modules/billing/plans");
    const priceAmount: Record<string, number> = {};
    for (const p of PUBLIC_PLANS) {
      priceAmount[p.price.monthly] = p.price.monthlyAmountBRL;
      priceAmount[p.price.yearly] = p.price.yearlyAmountBRL;
    }

    // Active subs for MRR
    const { data: activeSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("price_id, status, current_period_end, created_at")
      .in("status", ["active", "trialing"]);

    let mrr = 0;
    for (const s of activeSubs ?? []) {
      const amount = priceAmount[s.price_id] ?? 0;
      // If yearly plan, divide by 12
      const isYearly = PUBLIC_PLANS.some((p) => p.price.yearly === s.price_id);
      mrr += isYearly ? Math.round(amount / 12) : amount;
    }

    // Revenue last 30/90 days (rough: subscriptions created)
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400_000);
    const d90 = new Date(now.getTime() - 90 * 86400_000);

    const { data: subs30 } = await supabaseAdmin
      .from("subscriptions")
      .select("price_id, created_at")
      .gte("created_at", d30.toISOString());
    const { data: subs90 } = await supabaseAdmin
      .from("subscriptions")
      .select("price_id, created_at")
      .gte("created_at", d90.toISOString());

    const revenue = (rows: { price_id: string }[] | null) =>
      (rows ?? []).reduce((sum, r) => sum + (priceAmount[r.price_id] ?? 0), 0);

    // Monthly revenue last 12 months
    const startOfSeries = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const { data: series } = await supabaseAdmin
      .from("subscriptions")
      .select("price_id, created_at")
      .gte("created_at", startOfSeries.toISOString());

    const monthly: { month: string; revenue: number; count: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthly.push({ month: key, revenue: 0, count: 0 });
    }
    for (const s of series ?? []) {
      const d = new Date(s.created_at ?? Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = monthly.find((m) => m.month === key);
      if (bucket) {
        bucket.revenue += priceAmount[s.price_id] ?? 0;
        bucket.count += 1;
      }
    }

    const { count: canceled30 } = await supabaseAdmin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "canceled")
      .gte("updated_at", d30.toISOString());
    const { count: activeCount } = await supabaseAdmin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "trialing"]);

    const churn = (activeCount ?? 0) + (canceled30 ?? 0) > 0
      ? ((canceled30 ?? 0) / ((activeCount ?? 0) + (canceled30 ?? 0))) * 100
      : 0;
    const ticketMedio = (activeSubs?.length ?? 0) > 0 ? mrr / (activeSubs?.length ?? 1) : 0;

    return {
      mrr,
      arr: mrr * 12,
      revenue30d: revenue(subs30 ?? []),
      revenue90d: revenue(subs90 ?? []),
      churnPct: Number(churn.toFixed(1)),
      ticketMedio: Math.round(ticketMedio),
      activeCount: activeCount ?? 0,
      canceled30: canceled30 ?? 0,
      monthly,
    };
  });

export const listRecentTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { PUBLIC_PLANS } = await import("@/modules/billing/plans");
    const priceAmount: Record<string, number> = {};
    const priceLabel: Record<string, string> = {};
    for (const p of PUBLIC_PLANS) {
      priceAmount[p.price.monthly] = p.price.monthlyAmountBRL;
      priceAmount[p.price.yearly] = p.price.yearlyAmountBRL;
      priceLabel[p.price.monthly] = `${p.displayName} · Mensal`;
      priceLabel[p.price.yearly] = `${p.displayName} · Anual`;
    }

    const { data: subs, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, price_id, product_id, status, created_at, current_period_end")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((subs ?? []).map((s) => s.user_id)));
    const profs: Record<string, { full_name: string | null; email: string | null }> = {};
    if (userIds.length) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      for (const p of data ?? []) profs[p.id] = { full_name: p.full_name, email: p.email };
    }

    return (subs ?? []).map((s) => ({
      id: s.id,
      user: profs[s.user_id] ?? null,
      plan: priceLabel[s.price_id] ?? s.price_id,
      amount: priceAmount[s.price_id] ?? 0,
      status: s.status,
      created_at: s.created_at,
    }));
  });

// ============ COUPONS ============

export const listCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      code: string;
      description?: string;
      discount_type: "percent" | "fixed";
      discount_value: number;
      max_redemptions?: number | null;
      valid_until?: string | null;
      applies_to_plan?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin
      .from("coupons")
      .insert({
        code: data.code.trim().toUpperCase(),
        description: data.description ?? null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        max_redemptions: data.max_redemptions ?? null,
        valid_until: data.valid_until ?? null,
        applies_to_plan: data.applies_to_plan ?? null,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await audit(supabaseAdmin, context.userId, "coupon.create", "coupon", created.id, {
      code: data.code,
    });
    return { id: created.id };
  });

export const updateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; active?: boolean; valid_until?: string | null }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { active?: boolean; valid_until?: string | null } = {};
    if (typeof data.active === "boolean") patch.active = data.active;
    if (data.valid_until !== undefined) patch.valid_until = data.valid_until;
    const { error } = await supabaseAdmin.from("coupons").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(supabaseAdmin, context.userId, "coupon.update", "coupon", data.id, patch);
    return { ok: true };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(supabaseAdmin, context.userId, "coupon.delete", "coupon", data.id);
    return { ok: true };
  });
