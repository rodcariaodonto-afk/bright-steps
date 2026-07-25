import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getEngine } from "../registry/engine-registry";
import { startGameSession, recordGameEvent, completeGameSession } from "../api.functions";
import type { EngineResult, GameEventInput } from "../engines/types";
import { useTranslatedContent } from "@/hooks/use-translated-content";

interface Props {
  childId: string;
  game: {
    id: string;
    title: string;
    engine_code: string | null;
    config: unknown;
    accessibility?: {
      hasAudio?: boolean;
      highContrast?: boolean;
      reducedMotion?: boolean;
    } | null;
  };
  onExit: () => void;
}

export function GamePlayer({ childId, game, onExit }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<{ result: EngineResult; stars: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number>(Date.now());

  const startFn = useServerFn(startGameSession);
  const eventFn = useServerFn(recordGameEvent);
  const completeFn = useServerFn(completeGameSession);

  const engine = game.engine_code ? getEngine(game.engine_code) : undefined;
  const { data: t, loading: tLoading } = useTranslatedContent("game", game.id, {
    title: game.title,
    config: game.config as never,
  });

  useEffect(() => {
    let cancelled = false;
    if (!engine) return;
    startedAt.current = Date.now();
    startFn({ data: { childId, gameId: game.id } })
      .then((r) => {
        if (!cancelled) setSessionId(r.sessionId);
      })
      .catch((e) => !cancelled && setError(e?.message ?? "Erro ao iniciar jogo"));
    return () => {
      cancelled = true;
    };
  }, [engine, childId, game.id, startFn]);

  const emit = useCallback(
    (evt: GameEventInput) => {
      if (!sessionId) return;
      eventFn({
        data: {
          sessionId,
          eventType: evt.event_type,
          payload: evt.payload ?? {},
          elapsedMs: evt.elapsed_ms ?? Date.now() - startedAt.current,
        },
      }).catch(() => void 0);
    },
    [sessionId, eventFn],
  );

  const finish = useCallback(
    async (result: EngineResult) => {
      if (!sessionId) return;
      try {
        const { starsAwarded } = await completeFn({
          data: {
            sessionId,
            score: result.score,
            maxScore: result.maxScore,
            status: result.status,
            metadata: result.metadata ?? {},
          },
        });
        setFinalResult({ result, stars: starsAwarded });
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    [sessionId, completeFn],
  );

  const handleExit = useCallback(async () => {
    if (sessionId && !finalResult) {
      try {
        await completeFn({
          data: { sessionId, score: 0, maxScore: 0, status: "abandoned" },
        });
      } catch {
        // silent
      }
    }
    onExit();
  }, [sessionId, finalResult, completeFn, onExit]);

  if (!engine) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Este jogo usa o motor <strong>{game.engine_code ?? "(nenhum)"}</strong>, que ainda não está disponível nesta versão.
          </p>
          <Button onClick={onExit}>Voltar</Button>
        </div>
      </div>
    );
  }

  const a11y = {
    audioEnabled: game.accessibility?.hasAudio ?? true,
    highContrast: game.accessibility?.highContrast ?? false,
    reducedMotion: game.accessibility?.reducedMotion ?? false,
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Jogando</p>
          <h2 className="font-semibold">{t.title}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleExit}>
          <X className="mr-1 h-4 w-4" /> Sair
        </Button>
      </header>
      <main className="flex-1 overflow-auto">
        {error ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-destructive">{error}</div>
        ) : finalResult ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="text-6xl">🎉</div>
            <h3 className="text-2xl font-bold">Muito bem!</h3>
            <div className="flex items-center gap-2 rounded-full bg-yellow-300 px-4 py-2 text-yellow-900">
              <Star className="h-5 w-5 fill-yellow-600 text-yellow-700" />
              <span className="text-lg font-black">+{finalResult.stars}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Pontuação: {finalResult.result.score} / {finalResult.result.maxScore}
            </p>
            <Button onClick={onExit} className="mt-4">
              Voltar
            </Button>
          </div>
        ) : !sessionId || tLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <engine.Component config={t.config as never} emit={emit} onFinish={finish} a11y={a11y} />
        )}
      </main>
    </div>
  );
}
