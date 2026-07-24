import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { ATLAS_GUARDRAILS } from "@/modules/ai/prompts/guardrails";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;

const MODEL = "google/gemini-2.5-flash";
const CACHE_TTL_HOURS = 24;
const RANGE_DAYS = 30;
const MIN_EVENTS = 5;

const InsightSchema = z.object({
  title: z.string(),
  description: z.string(),
  evidence: z.string(),
  suggested_article_slug: z.string().nullable(),
});
type Insight = z.infer<typeof InsightSchema>;

const InsightsPayload = z.object({
  insights: z.array(InsightSchema).max(6),
});

export interface ChildInsightsResult {
  insights: Insight[];
  generatedAt: string | null;
  rangeStart: string;
  rangeEnd: string;
  status: "ok" | "empty" | "error";
  message?: string;
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function hourBucket(iso: string) {
  const h = new Date(iso).getHours();
  if (h < 6) return "madrugada (0h–6h)";
  if (h < 12) return "manhã (6h–12h)";
  if (h < 18) return "tarde (12h–18h)";
  return "noite (18h–24h)";
}

async function aggregateChildData(
  supabase: DB,
  childId: string,
  rangeStart: string,
) {
  const [{ data: behavior }, { data: mood }, { data: meds }] = await Promise.all([
    supabase
      .from("behavior_events")
      .select("occurred_at, antecedent, behavior, consequence, intensity, triggers")
      .eq("child_id", childId)
      .gte("occurred_at", rangeStart),
    supabase
      .from("mood_logs")
      .select("logged_at, mood, note")
      .eq("child_id", childId)
      .gte("logged_at", rangeStart),
    supabase
      .from("medication_logs")
      .select("taken_at, status, medication_id")
      .eq("child_id", childId)
      .gte("taken_at", rangeStart),
  ]);

  const behaviorRows = behavior ?? [];
  const moodRows = mood ?? [];
  const medRows = meds ?? [];
  const total = behaviorRows.length + moodRows.length + medRows.length;

  const triggerCounts = new Map<string, number>();
  const behaviorHourCounts = new Map<string, number>();
  for (const b of behaviorRows) {
    const trigs: string[] = Array.isArray(b.triggers) ? (b.triggers as string[]) : [];
    for (const t of trigs) triggerCounts.set(t, (triggerCounts.get(t) ?? 0) + 1);
    behaviorHourCounts.set(
      hourBucket(b.occurred_at),
      (behaviorHourCounts.get(hourBucket(b.occurred_at)) ?? 0) + 1,
    );
  }

  const moodCounts = new Map<string, number>();
  for (const m of moodRows) {
    moodCounts.set(m.mood, (moodCounts.get(m.mood) ?? 0) + 1);
  }

  const medStatusCounts = new Map<string, number>();
  for (const m of medRows) {
    medStatusCounts.set(m.status, (medStatusCounts.get(m.status) ?? 0) + 1);
  }

  const topEntries = (m: Map<string, number>, n = 5) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, v]) => `${k}: ${v}`);

  return {
    total,
    counts: {
      behavior: behaviorRows.length,
      mood: moodRows.length,
      medication: medRows.length,
    },
    topTriggers: topEntries(triggerCounts),
    behaviorByHour: topEntries(behaviorHourCounts),
    moodDistribution: topEntries(moodCounts),
    medicationAdherence: topEntries(medStatusCounts),
  };
}

async function fetchArticleSlugs(supabase: DB) {
  const { data } = await supabase
    .from("library_articles")
    .select("slug, title, library_categories(slug, name)")
    .not("published_at", "is", null)
    .limit(50);
  type Row = { slug: string; title: string; library_categories: { name: string } | null };
  return ((data ?? []) as unknown as Row[]).map((a) => ({
    slug: a.slug,
    title: a.title,
    category: a.library_categories?.name ?? "",
  }));
}

function buildPrompt(
  agg: Awaited<ReturnType<typeof aggregateChildData>>,
  articles: { slug: string; title: string; category: string }[],
) {
  return `Analise os últimos ${RANGE_DAYS} dias de registros de uma criança neurodivergente e devolva de 3 a 6 padrões observados em linguagem acolhedora (PT-BR).

DADOS AGREGADOS:
- Registros de comportamento: ${agg.counts.behavior}
- Registros de humor: ${agg.counts.mood}
- Registros de medicação: ${agg.counts.medication}
- Gatilhos mais frequentes: ${agg.topTriggers.join("; ") || "nenhum"}
- Comportamentos por período do dia: ${agg.behaviorByHour.join("; ") || "nenhum"}
- Distribuição de humor: ${agg.moodDistribution.join("; ") || "nenhum"}
- Adesão à medicação: ${agg.medicationAdherence.join("; ") || "nenhum"}

ARTIGOS DA BIBLIOTECA (use o slug exatamente como está, só se casar bem com o padrão):
${articles.map((a) => `- ${a.slug} | ${a.title} | ${a.category}`).join("\n") || "nenhum"}

REGRAS:
- Cada padrão deve ter: title (curto, PT-BR), description (1-2 frases acolhedoras), evidence (cita os números/horários dos dados acima), suggested_article_slug (slug de artigo relevante ou null).
- NÃO invente dados que não estão acima.
- NÃO emita diagnóstico. Use linguagem de observação ("observamos que...", "os registros sugerem...").
- Se algum eixo tiver poucos dados, retorne menos padrões.`;
}

async function generateInsights(
  supabase: DB,
  childId: string,
): Promise<ChildInsightsResult> {
  const rangeStart = isoDaysAgo(RANGE_DAYS);
  const rangeEnd = new Date().toISOString();

  const agg = await aggregateChildData(supabase, childId, rangeStart);

  if (agg.total < MIN_EVENTS) {
    return {
      insights: [],
      generatedAt: null,
      rangeStart,
      rangeEnd,
      status: "empty",
      message:
        "Ainda não há dados suficientes dos últimos 30 dias para detectar padrões. Continue registrando humor, comportamento e medicação.",
    };
  }

  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    return {
      insights: [],
      generatedAt: null,
      rangeStart,
      rangeEnd,
      status: "error",
      message: "IA indisponível no momento.",
    };
  }

  const articles = await fetchArticleSlugs(supabase);
  const gateway = createLovableAiGatewayProvider(apiKey);
  const model = gateway(MODEL);

  let parsed: z.infer<typeof InsightsPayload> = { insights: [] };
  try {
    const { output } = await generateText({
      model,
      system: ATLAS_GUARDRAILS,
      output: Output.object({ schema: InsightsPayload }),
      prompt: buildPrompt(agg, articles),
    });
    parsed = output;
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      return {
        insights: [],
        generatedAt: null,
        rangeStart,
        rangeEnd,
        status: "error",
        message: "Não foi possível gerar padrões agora. Tente novamente em instantes.",
      };
    }
    throw err;
  }

  const validSlugs = new Set(articles.map((a) => a.slug));
  const cleaned: Insight[] = parsed.insights.slice(0, 6).map((i) => ({
    ...i,
    suggested_article_slug:
      i.suggested_article_slug && validSlugs.has(i.suggested_article_slug)
        ? i.suggested_article_slug
        : null,
  }));

  const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3600 * 1000).toISOString();
  const { data: inserted } = await supabase
    .from("insights_cache")
    .insert({
      child_id: childId,
      insights: cleaned,
      range_start: rangeStart,
      range_end: rangeEnd,
      model: MODEL,
      expires_at: expiresAt,
    })
    .select("created_at")
    .maybeSingle();

  return {
    insights: cleaned,
    generatedAt: inserted?.created_at ?? new Date().toISOString(),
    rangeStart,
    rangeEnd,
    status: "ok",
  };
}

export const getChildInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ childId: z.string().uuid(), force: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<ChildInsightsResult> => {
    const { supabase } = context;

    if (!data.force) {
      const { data: cached } = await supabase
        .from("insights_cache")
        .select("insights, range_start, range_end, created_at, expires_at")
        .eq("child_id", data.childId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached && new Date(cached.expires_at).getTime() > Date.now()) {
        return {
          insights: (cached.insights as Insight[]) ?? [],
          generatedAt: cached.created_at,
          rangeStart: cached.range_start,
          rangeEnd: cached.range_end,
          status: "ok",
        };
      }
    }

    return generateInsights(supabase, data.childId);
  });
