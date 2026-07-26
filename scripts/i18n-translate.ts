#!/usr/bin/env bun
/**
 * Traduz src/locales/pt-BR/*.json para os 13 idiomas restantes via Lovable AI Gateway.
 * Preserva chaves, placeholders {{var}} e estrutura. Cria arquivos ausentes;
 * mescla com existentes sem sobrescrever chaves já traduzidas manualmente.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY!;
if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

const SOURCE_DIR = "src/locales/pt-BR";
const OUT_ROOT = "src/locales";

const TARGETS: Record<string, string> = { en: 'English (US)',
  es: "Spanish (Spain, neutral Latin American Spanish acceptable)",
  fr: "French (France)",
  it: "Italian",
  de: "German (Germany, formal Sie form)",
  nl: "Dutch (Netherlands)",
  pl: "Polish",
  tr: "Turkish",
  ar: "Arabic (Modern Standard Arabic, right-to-left)",
  ja: "Japanese (polite です/ます form)",
  ko: "Korean (polite 존댓말 form)",
  "zh-CN": "Simplified Chinese (Mainland China)",
  "zh-TW": "Traditional Chinese (Taiwan)",
  ru: "Russian",
};

const NAMESPACES = ["common", "landing", "auth", "app", "pro", "admin", "ai", "kid"];

// Merge deep: preserves existing translated leaves; only fills missing keys.
function deepMerge(existing: any, incoming: any): any {
  if (typeof existing !== "object" || existing === null || Array.isArray(existing)) {
    return existing ?? incoming;
  }
  const out: any = Array.isArray(incoming) ? [...incoming] : { ...incoming };
  for (const k of Object.keys(existing)) {
    if (k in out) out[k] = deepMerge(existing[k], out[k]);
    else out[k] = existing[k];
  }
  return out;
}

async function translate(source: any, langLabel: string, ns: string): Promise<any> {
  const prompt = `You are a professional software localization translator.

Translate the JSON values below from Brazilian Portuguese into ${langLabel}.

STRICT RULES:
- Keep ALL keys exactly as in the source (do not translate keys).
- Keep the JSON structure identical (same nesting, same array order/length).
- Preserve ALL placeholders like {{name}}, {{count}}, {name}, %s exactly.
- Keep emoji, HTML tags, URLs and markdown intact.
- Translate values only. If a value is empty string or a code/enum-like short token, leave it as-is.
- Do NOT add comments or explanations.
- Output MUST be valid minified JSON only, no markdown fences.
- Tone: warm, welcoming, professional. Product name "Meu Mundo Azul" translates to the equivalent of "My Blue World" in the target language when it appears as a phrase; keep it as "Meu Mundo Azul" when it is clearly a brand mark. AI assistant name "Azul" stays as "Azul" (brand).
- Namespace context: "${ns}" (${
    ns === "pro"
      ? "clinical workspace for healthcare professionals"
      : ns === "kid"
        ? "child-facing UI, playful and simple language, short sentences"
        : ns === "admin"
          ? "internal super-admin panel"
          : "family-facing app"
  }).

SOURCE JSON:
${JSON.stringify(source)}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a JSON-only translator. Reply with valid JSON, nothing else." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 32000,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gateway ${res.status}: ${body.slice(0, 400)}`);
  }

  const data = (await res.json()) as any;
  let content: string = data.choices?.[0]?.message?.content ?? "";
  content = content.trim();
  // Robust fence strip: sometimes response is ```json\n{...}\n```
  content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  // Extract from first { to last } as final safety net
  const first = content.indexOf("{");
  const last = content.lastIndexOf("}");
  if (first > 0 || last < content.length - 1) {
    if (first >= 0 && last > first) content = content.slice(first, last + 1);
  }
  try {
    return JSON.parse(content);
  } catch {
    // Repair attempt 1: strip trailing garbage after last balanced brace.
    const repaired = repairJson(content);
    if (repaired) {
      try {
        return JSON.parse(repaired);
      } catch {
        // fall through
      }
    }
    console.error(`  [${ns}] JSON parse fail, snippet:`, content.slice(0, 300));
    throw new Error("JSON parse failed after repair");
  }
}

/** Encontra o primeiro `{` e caminha contando chaves fora de strings até o `}` que fecha. */
function repairJson(input: string): string | null {
  const start = input.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < input.length; i++) {
    const ch = input[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return input.slice(start, i + 1);
    }
  }
  return null;
}

async function main() {
  const only = process.env.ONLY_LOCALE;
  const onlyNs = process.env.ONLY_NS;
  const targets = only ? { [only]: TARGETS[only] } : TARGETS;

  for (const [code, label] of Object.entries(targets)) {
    if (!label) continue;
    const outDir = join(OUT_ROOT, code);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    for (const ns of NAMESPACES) {
      if (onlyNs && ns !== onlyNs) continue;
      const src = join(SOURCE_DIR, `${ns}.json`);
      if (!existsSync(src)) continue;
      const outPath = join(outDir, `${ns}.json`);

      const sourceJson = JSON.parse(readFileSync(src, "utf8"));

      const t0 = Date.now();
      try {
        console.log(`[${code}] ${ns}.json…`);
        const translated = await translate(sourceJson, label, ns);

        const existing = existsSync(outPath)
          ? JSON.parse(readFileSync(outPath, "utf8"))
          : {};
        const merged = deepMerge(existing, translated);

        writeFileSync(outPath, JSON.stringify(merged, null, 2) + "\n", "utf8");
        console.log(`  ✓ ${outPath} (${Date.now() - t0}ms)`);
      } catch (err) {
        console.error(`  ✗ ${code}/${ns}:`, (err as Error).message);
      }
    }
  }

  console.log("\nDone. Files present:");
  for (const code of Object.keys(TARGETS)) {
    const dir = join(OUT_ROOT, code);
    if (existsSync(dir)) console.log(`  ${code}: ${readdirSync(dir).join(", ")}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
