import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Response("Forbidden", { status: 403 });
}

function dailyBuckets(rows: { created_at: string }[], days = 30) {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

export const getAnalyticsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString();

    const [profiles, families, children, sessions, games, moods, subs] = await Promise.all([
      supabaseAdmin.from("profiles").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin.from("families").select("created_at").gte("created_at", sinceIso).is("deleted_at", null),
      supabaseAdmin.from("children").select("created_at").gte("created_at", sinceIso).is("deleted_at", null),
      supabaseAdmin.from("clinical_sessions").select("created_at").gte("created_at", sinceIso),
      supabaseAdmin.from("game_sessions").select("created_at, game_id, status").gte("created_at", sinceIso),
      supabaseAdmin.from("mood_logs").select("level, created_at").gte("created_at", sinceIso),
      supabaseAdmin.from("subscriptions").select("status, price_id, product_id"),
    ]);

    const gameSessions = (games.data ?? []).filter((g: any) => g.status === "completed");
    const gameCounts = new Map<string, number>();
    for (const g of gameSessions) {
      gameCounts.set(g.game_id, (gameCounts.get(g.game_id) ?? 0) + 1);
    }
    const topGameIds = Array.from(gameCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const { data: gameMeta } = await supabaseAdmin
      .from("content_games")
      .select("id, title")
      .in("id", topGameIds.length ? topGameIds.map(([id]) => id) : ["00000000-0000-0000-0000-000000000000"]);
    const gameNameMap = new Map((gameMeta ?? []).map((g: any) => [g.id, g.title]));
    const topGames = topGameIds.map(([id, count]) => ({
      title: gameNameMap.get(id) ?? "—",
      count,
    }));

    const moodDist = new Map<string, number>();
    for (const m of moods.data ?? []) {
      const key = String(m.level);
      moodDist.set(key, (moodDist.get(key) ?? 0) + 1);
    }

    const activeSubs = (subs.data ?? []).filter((s: any) =>
      ["active", "trialing"].includes(s.status),
    );
    const planCounts = new Map<string, number>();
    for (const s of activeSubs) {
      planCounts.set(s.product_id ?? s.price_id ?? "unknown", (planCounts.get(s.product_id ?? s.price_id ?? "unknown") ?? 0) + 1);
    }

    return {
      series: {
        users: dailyBuckets(profiles.data ?? []),
        families: dailyBuckets(families.data ?? []),
        children: dailyBuckets(children.data ?? []),
        sessions: dailyBuckets(sessions.data ?? []),
        games: dailyBuckets(gameSessions),
      },
      totals: {
        newUsers: profiles.data?.length ?? 0,
        newFamilies: families.data?.length ?? 0,
        newChildren: children.data?.length ?? 0,
        sessions: sessions.data?.length ?? 0,
        gamesCompleted: gameSessions.length,
        activeSubscriptions: activeSubs.length,
      },
      topGames,
      moodDistribution: Array.from(moodDist.entries()).map(([level, count]) => ({ mood: level, count })),
      plans: Array.from(planCounts.entries()).map(([plan, count]) => ({ plan, count })),
    };
  });
