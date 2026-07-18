import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  createLovableAiGatewayProvider,
  type getLovableAiGatewayRunId,
} from "@/lib/ai-gateway.server";

import { buildContext, serializeContext } from "./context/builder";
import { getLatestSummary } from "./memory/long-term";
import { listMemories, serializeMemories } from "./memory/episodic";
import { getPersona, type PersonaId } from "./personas";
import { recordAIUsage } from "./telemetry";

/**
 * Fachada única de IA do ATLAS.
 * Nenhuma route/component deve chamar `streamText`/`generateText` direto.
 * Sempre `runAtlasStream({ persona, ... })`.
 */

export interface RunAtlasStreamInput {
  persona: PersonaId;
  requesterId: string;
  childId?: string;
  messages: UIMessage[];
  lovableApiKey: string;
  initialRunId?: string;
}

export async function runAtlasStream(input: RunAtlasStreamInput) {
  const persona = getPersona(input.persona);
  const started = Date.now();

  const bundle = await buildContext({
    persona: input.persona,
    requesterId: input.requesterId,
    childId: input.childId,
  });
  const authorizedContext = serializeContext(bundle);

  const episodic = input.childId ? listMemories(input.childId) : [];
  const summary = input.childId ? await getLatestSummary(input.childId) : "";
  const memory = [serializeMemories(episodic), summary].filter(Boolean).join("\n\n");

  const gateway = createLovableAiGatewayProvider(input.lovableApiKey, input.initialRunId);
  const model = gateway(persona.model);

  try {
    const result = streamText({
      model,
      system: persona.systemPrompt({ authorizedContext, memory }),
      messages: await convertToModelMessages(input.messages),
      onFinish: () => {
        recordAIUsage({
          persona: input.persona,
          model: persona.model,
          requesterId: input.requesterId,
          childId: input.childId,
          latencyMs: Date.now() - started,
          status: "ok",
          runId: gateway.getRunId(),
        });
      },
    });

    return { result, gateway };
  } catch (err) {
    recordAIUsage({
      persona: input.persona,
      model: persona.model,
      requesterId: input.requesterId,
      childId: input.childId,
      latencyMs: Date.now() - started,
      status: "error",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

// Re-export para conveniência
export type { getLovableAiGatewayRunId };
