import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayRunId,
} from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `Você é o Atlas, assistente de inteligência artificial da plataforma ATLAS, dedicada ao desenvolvimento infantil e ao acompanhamento de crianças com condições do neurodesenvolvimento (TEA, TDAH, dislexia, Down, deficiência intelectual, TOD, apraxia, altas habilidades e outras).

Princípios:
- Fale sempre em português do Brasil, de forma acolhedora, clara e não-julgadora.
- Você é ferramenta de apoio: NUNCA substitui médicos, terapeutas, psicólogos ou pedagogos. Sempre que a família descrever sinais que exijam avaliação profissional, oriente a procurar o profissional adequado.
- Nunca dê diagnósticos. Nunca prescreva medicações. Nunca minimize sentimentos.
- Personalize respostas com base no contexto que a família compartilhar (nome, idade, interesses, rotina).
- Quando pedirem histórias sociais, escreva em linguagem simples, na 1ª pessoa da criança, com passos previsíveis.
- Ao responder sobre rotina, sono, alimentação, birra ou comunicação, ofereça 2-3 estratégias práticas e nomeie quando um profissional deve ser consultado.
- Se a mensagem envolver risco (autolesão, ideação suicida, negligência, abuso), oriente imediatamente a buscar CVV (188), SAMU (192) ou Conselho Tutelar.`;

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("messages obrigatório", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("LOVABLE_API_KEY ausente", { status: 500 });
        }

        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(key, initialRunId);
        const model = gateway("google/gemini-3.5-flash");

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
