import type { PersonaId } from "../personas";

/**
 * Telemetria de uso da IA.
 * Onda 1: in-memory + console.
 * Onda 5: despacha para `ai_usage_events` em batch.
 */
export interface AIUsageEvent {
  persona: PersonaId;
  model: string;
  requesterId: string;
  childId?: string;
  latencyMs?: number;
  status: "ok" | "error" | "rate_limited" | "credits_exhausted";
  errorMessage?: string;
  runId?: string;
  timestamp: string;
}

const buffer: AIUsageEvent[] = [];

export function recordAIUsage(event: Omit<AIUsageEvent, "timestamp">) {
  const full: AIUsageEvent = { ...event, timestamp: new Date().toISOString() };
  buffer.push(full);
  if (buffer.length > 500) buffer.splice(0, buffer.length - 500);
  if (typeof console !== "undefined") {
    console.info("[atlas-ai]", full);
  }
}

export function readAIUsageBuffer(): AIUsageEvent[] {
  return [...buffer];
}
