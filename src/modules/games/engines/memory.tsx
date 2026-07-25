import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { EngineDefinition, EngineProps } from "./types";

interface MemoryPair {
  id: string;
  label: string;
  emoji?: string;
  imageUrl?: string;
}
interface MemoryConfig {
  pairs: MemoryPair[];
  gridSize?: "2x2" | "2x3" | "3x4" | "4x4" | "4x5";
  timeLimitSec?: number;
}

interface Card {
  key: string;
  pairId: string;
  face: string;
  matched: boolean;
  flipped: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GRID_COLS: Record<string, string> = {
  "2x2": "grid-cols-2",
  "2x3": "grid-cols-3",
  "3x4": "grid-cols-4",
  "4x4": "grid-cols-4",
  "4x5": "grid-cols-5",
};

function MemoryGame({ config, emit, onFinish, a11y }: EngineProps<MemoryConfig>) {
  const pairs = config?.pairs ?? [];
  const gridSize = config?.gridSize ?? "3x4";
  const timeLimit = config?.timeLimitSec ?? 0;

  const initialCards = useMemo<Card[]>(
    () =>
      shuffle(
        pairs.flatMap((p, i) => [
          { key: `${p.id}-a-${i}`, pairId: p.id, face: p.emoji || p.label, matched: false, flipped: false },
          { key: `${p.id}-b-${i}`, pairId: p.id, face: p.emoji || p.label, matched: false, flipped: false },
        ]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [cards, setCards] = useState<Card[]>(initialCards);
  const [picked, setPicked] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now());
  const finished = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const finish = useCallback(
    (status: "completed" | "abandoned") => {
      if (finished.current) return;
      finished.current = true;
      onFinish({
        score: matches,
        maxScore: pairs.length,
        status,
        metadata: { elapsedSec: Math.floor((Date.now() - startedAt.current) / 1000) },
      });
    },
    [matches, pairs.length, onFinish],
  );

  useEffect(() => {
    if (matches > 0 && matches === pairs.length) finish("completed");
  }, [matches, pairs.length, finish]);

  useEffect(() => {
    if (timeLimit > 0 && elapsed >= timeLimit) finish("completed");
  }, [elapsed, timeLimit, finish]);

  const flip = (idx: number) => {
    if (picked.length === 2) return;
    if (cards[idx].flipped || cards[idx].matched) return;
    const next = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
    setCards(next);
    emit({ event_type: "card_flipped", payload: { index: idx, pairId: cards[idx].pairId } });
    const newPicked = [...picked, idx];
    setPicked(newPicked);
    if (newPicked.length === 2) {
      const [a, b] = newPicked;
      if (next[a].pairId === next[b].pairId) {
        setTimeout(() => {
          setCards((cs) => cs.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
          setMatches((m) => m + 1);
          setPicked([]);
          emit({ event_type: "pair_matched", payload: { pairId: next[a].pairId } });
        }, 500);
      } else {
        setTimeout(() => {
          setCards((cs) => cs.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)));
          setPicked([]);
          emit({ event_type: "pair_missed", payload: { a: next[a].pairId, b: next[b].pairId } });
        }, 900);
      }
    }
  };

  if (pairs.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">Sem pares configurados.</div>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Pares: {matches} / {pairs.length}</span>
        <span>Tempo: {elapsed}s{timeLimit > 0 ? ` / ${timeLimit}s` : ""}</span>
      </div>
      <div className={cn("grid gap-3", GRID_COLS[gridSize] ?? "grid-cols-4")}>
        {cards.map((c, i) => {
          const revealed = c.flipped || c.matched;
          return (
            <button
              key={c.key}
              onClick={() => flip(i)}
              disabled={c.matched}
              aria-label={revealed ? c.face : "Carta virada"}
              className={cn(
                "aspect-square rounded-2xl border-2 text-4xl font-bold transition-all",
                a11y.reducedMotion ? "" : "hover:scale-[1.03]",
                revealed
                  ? c.matched
                    ? "border-green-500 bg-green-100 dark:bg-green-950"
                    : "border-primary bg-primary/10"
                  : "border-input bg-primary/80 text-transparent hover:bg-primary",
              )}
            >
              {revealed ? c.face : "?"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const memoryEngine: EngineDefinition<MemoryConfig> = {
  code: "memory",
  name: "Memória",
  listed: true,
  Component: MemoryGame,
  validateConfig: (cfg) => {
    const c = cfg as MemoryConfig;
    if (!c?.pairs || !Array.isArray(c.pairs) || c.pairs.length < 2)
      return "Adicione ao menos 2 itens em 'pairs'.";
    if (c.pairs.some((p) => !p.id || (!p.emoji && !p.label))) return "Cada par precisa de id e emoji/label.";
    return null;
  },
};
