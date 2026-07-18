import { createFileRoute } from "@tanstack/react-router";
import type { UIMessage } from "ai";

import { getLovableAiGatewayRunId } from "@/lib/ai-gateway.server";
import { runAtlasStream } from "@/modules/ai/gateway";
import type { PersonaId } from "@/modules/ai/personas";

type ChatRequestBody = {
  messages?: unknown;
  persona?: PersonaId;
  childId?: string;
  requesterId?: string;
};

const VALID_PERSONAS: PersonaId[] = ["family", "clinical", "child", "school", "admin"];

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("messages obrigatório", { status: 400 });
        }
        const persona: PersonaId = VALID_PERSONAS.includes(body.persona as PersonaId)
          ? (body.persona as PersonaId)
          : "family";

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("LOVABLE_API_KEY ausente", { status: 500 });
        }

        try {
          const { result } = await runAtlasStream({
            persona,
            requesterId: body.requesterId ?? "anon",
            childId: body.childId,
            messages: body.messages as UIMessage[],
            lovableApiKey: key,
            initialRunId: getLovableAiGatewayRunId(request),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: body.messages as UIMessage[],
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return new Response(`Falha na IA: ${msg}`, { status: 502 });
        }
      },
    },
  },
});
