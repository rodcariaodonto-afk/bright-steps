import { createServerFn } from "@tanstack/react-start";
import { createHash } from "crypto";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/**
 * Cache + tradução automática de conteúdo do CMS (histórias, jogos, etc).
 *
 * Fluxo:
 *  1. Cliente pede getTranslatedContent({ entityType, entityId, locale }).
 *  2. Se locale === source_locale ('pt-BR') → devolve original direto do banco.
 *  3. Se existe cache com mesmo source_hash → devolve cache.
 *  4. Caso contrário → chama IA (Gemini Flash), grava cache, devolve.
 */

const SOURCE_LOCALE = "pt-BR";
const TRANSLATION_MODEL = "google/gemini-2.5-flash";

type EntityType = "story" | "game";

interface TranslatedPayload {
  title: string;
  summary?: string | null;
  description?: string | null;
  config?: unknown;
}

function hashOf(obj: unknown): string {
  return createHash("sha256").update(JSON.stringify(obj ?? null)).digest("hex").slice(0, 24);
}

const LOCALE_NAMES: Record<string, string> = {
  "pt-BR": "Brazilian Portuguese",
  en: "English (US)",
  es: "Spanish",
  fr: "French",
  it: "Italian",
  de: "German",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  ar: "Arabic",
  ja: "Japanese",
  ko: "Korean",
  "zh-CN": "Simplified Chinese",
  "zh-TW": "Traditional Chinese",
  ru: "Russian",
};

async function loadEntity(
  supabase: any,
  entityType: EntityType,
  entityId: string,
): Promise<TranslatedPayload | null> {
  if (entityType === "story") {
    const { data } = await supabase
      .from("content_stories")
      .select("title,summary,config")
      .eq("id", entityId)
      .maybeSingle();
    if (!data) return null;
    return { title: data.title, summary: data.summary, config: data.config };
  }
  const { data } = await supabase
    .from("content_games")
    .select("title,description,config")
    .eq("id", entityId)
    .maybeSingle();
  if (!data) return null;
  return { title: data.title, description: data.description, config: data.config };
}

async function translateWithAI(
  source: TranslatedPayload,
  targetLocale: string,
): Promise<TranslatedPayload> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const targetName = LOCALE_NAMES[targetLocale] ?? targetLocale;

  const gateway = createLovableAiGatewayProvider(key);
  const prompt = [
    `You will receive a JSON object with user-facing content for a children/family app.`,
    `Translate every human-readable text value into ${targetName}.`,
    `Rules:`,
    `- Preserve the JSON structure and all keys EXACTLY.`,
    `- Do NOT translate keys, ids, slugs, "next" targets, urls, emojis, numbers, or booleans.`,
    `- Translate only string VALUES that are natural language shown to users (title, summary, description, text, label, question, prompt, choice labels, etc.).`,
    `- Keep tone kind, warm, child-friendly.`,
    `- Never use em-dashes ("—"). Use commas or periods.`,
    `- Return ONLY the translated JSON, no prose, no code fences.`,
    ``,
    `SOURCE JSON:`,
    JSON.stringify(source),
  ].join("\n");

  const { text } = await generateText({
    model: gateway(TRANSLATION_MODEL),
    prompt,
  });

  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const parsed = JSON.parse(cleaned);
  return {
    title: String(parsed.title ?? source.title),
    summary: parsed.summary ?? source.summary ?? null,
    description: parsed.description ?? source.description ?? null,
    config: parsed.config ?? source.config,
  };
}

export const getTranslatedContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { entityType: EntityType; entityId: string; locale: string }) => {
      if (!["story", "game"].includes(input.entityType)) throw new Error("Invalid entityType");
      if (!/^[a-zA-Z0-9-]+$/.test(input.locale)) throw new Error("Invalid locale");
      if (!/^[0-9a-f-]{36}$/i.test(input.entityId)) throw new Error("Invalid entityId");
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const source = await loadEntity(supabase, data.entityType, data.entityId);
    if (!source) throw new Error("Entity not found");

    const sourceHash = hashOf(source);

    // Original locale → devolve direto.
    if (data.locale === SOURCE_LOCALE) {
      return { payload: source, status: "source" as const, cached: false };
    }

    // Tenta cache.
    const { data: cached } = await supabase
      .from("content_translations")
      .select("payload,source_hash,status")
      .eq("entity_type", data.entityType)
      .eq("entity_id", data.entityId)
      .eq("locale", data.locale)
      .maybeSingle();

    if (cached && cached.source_hash === sourceHash) {
      return { payload: cached.payload as TranslatedPayload, status: cached.status, cached: true };
    }

    // Cache miss ou stale (mas preserva override manual mesmo se stale).
    if (cached && cached.status === "manual") {
      return { payload: cached.payload as TranslatedPayload, status: "manual", cached: true };
    }

    try {
      const translated = await translateWithAI(source, data.locale);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("content_translations").upsert(
        {
          entity_type: data.entityType,
          entity_id: data.entityId,
          locale: data.locale,
          source_locale: SOURCE_LOCALE,
          source_hash: sourceHash,
          payload: translated as any,
          status: "auto",
        },
        { onConflict: "entity_type,entity_id,locale" },
      );
      return { payload: translated, status: "auto" as const, cached: false };
    } catch (err) {
      // Fallback: devolve original em caso de falha de IA.
      console.error("[translate] AI failed, falling back to source", err);
      return { payload: source, status: "fallback" as const, cached: false };
    }
  });

export const translateContentBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { entityType: EntityType; entityId: string; locales: string[] }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const source = await loadEntity(supabase, data.entityType, data.entityId);
    if (!source) throw new Error("Entity not found");
    const sourceHash = hashOf(source);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const results: { locale: string; ok: boolean; error?: string }[] = [];

    for (const locale of data.locales) {
      if (locale === SOURCE_LOCALE) {
        results.push({ locale, ok: true });
        continue;
      }
      try {
        const translated = await translateWithAI(source, locale);
        await supabaseAdmin.from("content_translations").upsert(
          {
            entity_type: data.entityType,
            entity_id: data.entityId,
            locale,
            source_locale: SOURCE_LOCALE,
            source_hash: sourceHash,
            payload: translated as any,
            status: "auto",
          },
          { onConflict: "entity_type,entity_id,locale" },
        );
        results.push({ locale, ok: true });
      } catch (err) {
        results.push({ locale, ok: false, error: (err as Error).message });
      }
    }

    return { results };
  });

export const listContentTranslations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { entityType: EntityType; entityId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("content_translations")
      .select("locale,status,updated_at,source_hash")
      .eq("entity_type", data.entityType)
      .eq("entity_id", data.entityId);
    return { translations: rows ?? [] };
  });
