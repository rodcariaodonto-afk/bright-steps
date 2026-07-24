import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ReportStats = {
  moods?: { level: number; count: number }[];
  medications?: { name: string; doses: number }[];
  behaviors?: { category: string; count: number }[];
  routinesCompleted?: number;
  routinesTotal?: number;
  goals?: { title: string; status: string; progressCount: number }[];
};

type RequestBody = {
  childFirstName?: string;
  periodLabel?: string;
  stats?: ReportStats;
};

export const Route = createFileRoute("/api/reports/weekly")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as RequestBody;
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("LOVABLE_API_KEY ausente", { status: 500 });

        const name = body.childFirstName?.trim() || "a criança";
        const period = body.periodLabel?.trim() || "os últimos 7 dias";
        const stats = body.stats ?? {};

        const system = `Você é a Azul, assistente da plataforma Meu Mundo Azul.
Escreva um relatório semanal em português do Brasil para a família de ${name}.
Regras absolutas:
1. Nunca emita diagnóstico clínico.
2. Linguagem acolhedora, direta e sem jargões.
3. Baseie-se APENAS nos números fornecidos, sem inventar dados.
4. Estruture em três blocos curtos: "Resumo", "Destaques" (bullets), "Sugestões" (bullets acionáveis).
5. Se algum dado estiver zerado, aponte a lacuna com gentileza.
6. Não use travessões. Prefira vírgulas e pontos.`;

        const prompt = `Período: ${period}
Dados agregados:
${JSON.stringify(stats, null, 2)}

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
          const msg = err instanceof Error ? err.message : String(err);
          return new Response(`Falha na IA: ${msg}`, { status: 502 });
        }
      },
    },
  },
});
