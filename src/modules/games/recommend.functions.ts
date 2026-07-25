import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({ childId: z.string().uuid() });

interface StatRow {
  game_id: string;
  score: number | null;
  max_score: number | null;
  duration_ms: number | null;
  status: string | null;
}
interface GameRow {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  difficulty: string | null;
  age_min: number | null;
  age_max: number | null;
  engine_code: string | null;
  tags: string[] | null;
}

/**
 * Recomenda 3 jogos para a criança usando IA (Lovable AI Gemini flash).
 * Estratégia: coleta últimas sessões, calcula desempenho por categoria e
 * pede à IA para escolher jogos que sejam apropriados (nem fáceis demais,
 * nem frustrantes) do catálogo publicado.
 */
export const recommendGames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // 1. Verifica se caller tem acesso
    const { data: canAccess } = await supabase.rpc("can_access_child", {
      _child_id: data.childId,
      _user_id: context.userId,
    });
    if (!canAccess) throw new Error("Sem acesso a esta criança");

    // 2. Coleta últimas 30 sessões
    const { data: sessions } = await supabase
      .from("game_sessions")
      .select("game_id, score, max_score, duration_ms, status")
      .eq("child_id", data.childId)
      .order("started_at", { ascending: false })
      .limit(30);

    // 3. Catálogo publicado (limitado)
    const { data: engines } = await supabase.from("game_engines").select("code").eq("active", true);
    const activeCodes = (engines ?? []).map((e) => e.code);
    const { data: games } = await supabase
      .from("content_games")
      .select("id, slug, title, category, difficulty, age_min, age_max, engine_code, tags")
      .eq("published", true)
      .in("engine_code", activeCodes.length ? activeCodes : ["__none__"])
      .limit(60);

    const catalog = (games ?? []) as GameRow[];
    if (catalog.length === 0) return { recommendations: [], reasoning: "Catálogo vazio." };

    // 4. Idade e nome (para prompt)
    const { data: child } = await supabase
      .from("children")
      .select("full_name, nickname, birth_date, dominant_interest, declared_conditions")
      .eq("id", data.childId)
      .maybeSingle();

    const age = child?.birth_date
      ? Math.max(2, Math.floor((Date.now() - new Date(child.birth_date).getTime()) / (365.25 * 86400e3)))
      : null;

    // 5. Agrega stats por game
    const perGame = new Map<string, { plays: number; successRate: number; avgSec: number }>();
    for (const s of (sessions ?? []) as StatRow[]) {
      if (!s.game_id) continue;
      const acc = perGame.get(s.game_id) ?? { plays: 0, successRate: 0, avgSec: 0 };
      const sr = s.max_score && s.max_score > 0 ? (s.score ?? 0) / s.max_score : 0;
      const sec = (s.duration_ms ?? 0) / 1000;
      acc.plays += 1;
      acc.successRate = (acc.successRate * (acc.plays - 1) + sr) / acc.plays;
      acc.avgSec = (acc.avgSec * (acc.plays - 1) + sec) / acc.plays;
      perGame.set(s.game_id, acc);
    }

    // 6. Fallback simples (sem IA): jogos nunca jogados na faixa etária,
    // priorizando categorias com sucesso >= 0.6
    const fallback = () => {
      const nevePlayed = catalog.filter((g) => !perGame.has(g.id));
      const inAge = nevePlayed.filter((g) => (!age || (g.age_min ?? 0) <= age) && (!age || (g.age_max ?? 99) >= age));
      const pool = inAge.length ? inAge : nevePlayed.length ? nevePlayed : catalog;
      return pool.slice(0, 3).map((g) => ({ id: g.id, slug: g.slug, title: g.title, reason: "Novidade sugerida" }));
    };

    // 7. Chama IA (best effort)
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { recommendations: fallback(), reasoning: "Sugestões automáticas (IA indisponível)." };
    }

    const statsSummary = Array.from(perGame.entries()).map(([gid, v]) => {
      const g = catalog.find((c) => c.id === gid);
      return {
        title: g?.title ?? gid,
        category: g?.category,
        plays: v.plays,
        successRate: Number(v.successRate.toFixed(2)),
        avgSeconds: Math.round(v.avgSec),
      };
    });
    const catalogForModel = catalog.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      difficulty: g.difficulty,
      age: `${g.age_min ?? "?"}-${g.age_max ?? "?"}`,
      tags: g.tags ?? [],
    }));

    try {
      const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
      const { generateText, Output } = await import("ai");
      const gateway = createLovableAiGatewayProvider(apiKey);

      const prompt = `Você é a Azul, assistente da plataforma Meu Mundo Azul, ajudando uma criança neurodivergente a escolher próximos jogos terapêuticos.

Criança: ${child?.nickname ?? child?.full_name ?? "sem nome"} (idade aprox: ${age ?? "?"})
Interesse dominante: ${child?.dominant_interest ?? "não informado"}
Condições declaradas: ${(child?.declared_conditions ?? []).join(", ") || "não informadas"}

Histórico recente por jogo (successRate 0..1):
${JSON.stringify(statsSummary, null, 2)}

Catálogo disponível:
${JSON.stringify(catalogForModel)}

Escolha EXATAMENTE 3 jogos do catálogo respeitando:
- Adequação à idade;
- Evitar jogos já dominados (successRate >= 0.9 com 3+ tentativas);
- Sugerir 1 jogo NOVO e desafiador;
- Sugerir 1 jogo de reforço em categoria com dificuldade (successRate < 0.5);
- Sugerir 1 jogo alinhado ao interesse dominante quando possível;
- Motivo em UMA frase curta e afetiva em português (máx 90 caracteres).`;

      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        prompt,
        experimental_output: Output.object({
          schema: z.object({
            recommendations: z
              .array(z.object({ id: z.string(), reason: z.string() }))
              .length(3),
          }),
        }),
      });

      const out = experimental_output as { recommendations: { id: string; reason: string }[] };
      const enriched = out.recommendations
        .map((r) => {
          const g = catalog.find((c) => c.id === r.id);
          return g ? { id: g.id, slug: g.slug, title: g.title, reason: r.reason } : null;
        })
        .filter((v): v is { id: string; slug: string; title: string; reason: string } => !!v);

      if (enriched.length === 0) return { recommendations: fallback(), reasoning: "IA sem match; usando fallback." };
      return { recommendations: enriched, reasoning: "Escolhas da Azul" };
    } catch (e) {
      console.error("[recommendGames]", e);
      return { recommendations: fallback(), reasoning: "IA indisponível no momento." };
    }
  });
