import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createUserScopedSupabaseFromRequest } from "@/integrations/supabase/user-scoped.server";

const StatsSchema = z
  .object({
    moods: z.array(z.object({ level: z.number(), count: z.number() })).optional(),
    medications: z.array(z.object({ name: z.string(), doses: z.number() })).optional(),
    behaviors: z.array(z.object({ category: z.string(), count: z.number() })).optional(),
    routinesCompleted: z.number().optional(),
    routinesTotal: z.number().optional(),
    goals: z
      .array(z.object({ title: z.string(), status: z.string(), progressCount: z.number() }))
      .optional(),
  })
  .strict();

const BodySchema = z.object({
  childId: z.string().uuid(),
  periodLabel: z.string().min(1).max(120),
  stats: StatsSchema,
});

// Rate limit best-effort, NÃO confiável neste deploy (Cloudflare Workers = isolates
// efêmeros, sem estado compartilhado). Não protege contra abuso real — só reduz ruído
// acidental quando a mesma isolate atende duas chamadas seguidas.
// TODO: mover para Cloudflare KV (contador com TTL) se abuso real for observado.
const RATE_WINDOW_MS = 60_000;
const lastCallByKey = new Map<string, number>();

export const Route = createFileRoute("/api/reports/weekly")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("LOVABLE_API_KEY ausente", { status: 500 });

        // 1. Auth: sem token válido → 401 antes de qualquer chamada de IA.
        const { supabase, userId } = await createUserScopedSupabaseFromRequest(request);
        if (!supabase || !userId) return new Response("Unauthorized", { status: 401 });

        // 2. Validação de payload.
        let body: z.infer<typeof BodySchema>;
        try {
          body = BodySchema.parse(await request.json());
        } catch (err) {
          return new Response(`Payload inválido: ${(err as Error).message}`, { status: 400 });
        }

        // 3. Autorização via RPC canônica (guardians + family owners/members).
        const { data: canAccess, error: authzError } = await supabase.rpc("can_access_child", {
          _child_id: body.childId,
          _user_id: userId,
        });
        if (authzError) return new Response("Erro ao verificar acesso", { status: 500 });
        if (!canAccess) return new Response("Forbidden", { status: 403 });

        // 4. Nome de exibição vem do banco (RLS aplica), não do client.
        const { data: child, error: childError } = await supabase
          .from("children")
          .select("full_name, nickname")
          .eq("id", body.childId)
          .maybeSingle();
        if (childError || !child) return new Response("Criança não encontrada", { status: 404 });
        const displayName =
          child.nickname?.trim() || child.full_name.split(" ")[0] || "a criança";

        // 5. Rate limit por (user, child) — ver comentário no topo do arquivo.
        const rlKey = `${userId}:${body.childId}`;
        const now = Date.now();
        const last = lastCallByKey.get(rlKey) ?? 0;
        if (now - last < RATE_WINDOW_MS) {
          const retryAfter = Math.ceil((RATE_WINDOW_MS - (now - last)) / 1000);
          return new Response(`Aguarde ${retryAfter}s antes de gerar outro relatório.`, {
            status: 429,
            headers: { "Retry-After": String(retryAfter) },
          });
        }
        lastCallByKey.set(rlKey, now);

        const system = `Você é a Azul, assistente da plataforma Meu Mundo Azul.
Escreva um relatório semanal em português do Brasil para a família de ${displayName}.
Regras absolutas:
1. Nunca emita diagnóstico clínico.
2. Linguagem acolhedora, direta e sem jargões.
3. Baseie-se APENAS nos números fornecidos, sem inventar dados.
4. Estruture em três blocos curtos: "Resumo", "Destaques" (bullets), "Sugestões" (bullets acionáveis).
5. Se algum dado estiver zerado, aponte a lacuna com gentileza.
6. Não use travessões. Prefira vírgulas e pontos.`;

        const prompt = `Período: ${body.periodLabel}
Dados agregados:
${JSON.stringify(body.stats, null, 2)}

Gere o relatório agora.`;

        try {
          const provider = createLovableAiGatewayProvider(key);
          const { text } = await generateText({
            model: provider("google/gemini-3.5-flash"),
            system,
            prompt,
          });
          return Response.json({ summary: text });
        } catch (err) {
          // Libera o slot em caso de falha para o usuário poder retentar.
          lastCallByKey.delete(rlKey);
          const msg = err instanceof Error ? err.message : String(err);
          return new Response(`Falha na IA: ${msg}`, { status: 502 });
        }
      },
    },
  },
});
