import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const startInput = z.object({
  childId: z.string().uuid(),
  gameId: z.string().uuid(),
  difficulty: z.string().nullable().optional(),
});

export const startGameSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => startInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: sessionId, error } = await context.supabase.rpc("start_game_session", {
      _child_id: data.childId,
      _game_id: data.gameId,
      _difficulty: data.difficulty ?? undefined,
    });
    if (error) throw new Error(error.message);
    return { sessionId: sessionId as string };
  });

const eventInput = z.object({
  sessionId: z.string().uuid(),
  eventType: z.string().min(1).max(64),
  payload: z.record(z.unknown()).optional(),
  elapsedMs: z.number().int().nonnegative().optional(),
});

export const recordGameEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => eventInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("game_events").insert({
      session_id: data.sessionId,
      event_type: data.eventType,
      payload: (data.payload ?? {}) as never,
      elapsed_ms: data.elapsedMs ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const completeInput = z.object({
  sessionId: z.string().uuid(),
  score: z.number().int().nonnegative(),
  maxScore: z.number().int().nonnegative(),
  status: z.enum(["completed", "abandoned"]).default("completed"),
  metadata: z.record(z.unknown()).optional(),
});

export const completeGameSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => completeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: stars, error } = await context.supabase.rpc("complete_game_session", {
      _session_id: data.sessionId,
      _score: data.score,
      _max_score: data.maxScore,
      _status: data.status,
      _metadata: (data.metadata ?? {}) as never,
    });
    if (error) throw new Error(error.message);
    return { starsAwarded: (stars as number) ?? 0 };
  });
