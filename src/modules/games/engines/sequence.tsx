import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { EngineDefinition, EngineProps } from "./types";

interface SeqItem {
  id: string;
  label: string;
  emoji?: string;
}
interface SequenceConfig {
  prompt?: string;
  /** Ordem correta (array de ids). */
  order: string[];
  items: SeqItem[];
  shuffle?: boolean;
}

function shuffleArr<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function SequenceGame({ config, emit, onFinish }: EngineProps<SequenceConfig>) {
  const correct = config?.order ?? [];
  const items = config?.items ?? [];

  const initial = useMemo(() => {
    const ids = correct.length ? correct : items.map((i) => i.id);
    return config?.shuffle === false ? ids : shuffleArr(ids);
  }, [items, correct, config?.shuffle]);

  const [current, setCurrent] = useState<string[]>(initial);
  const [checked, setChecked] = useState(false);

  if (items.length < 2 || correct.length < 2) {
    return <div className="p-8 text-center text-muted-foreground">Sequência precisa de ao menos 2 items e uma ordem.</div>;
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= current.length) return;
    const next = [...current];
    [next[i], next[j]] = [next[j], next[i]];
    setCurrent(next);
    emit({ event_type: "item_moved", payload: { from: i, to: j } });
  };

  const check = () => {
    const score = current.reduce((acc, id, idx) => acc + (id === correct[idx] ? 1 : 0), 0);
    setChecked(true);
    emit({ event_type: "sequence_checked", payload: { score, total: correct.length } });
    setTimeout(() => {
      onFinish({
        score,
        maxScore: correct.length,
        status: "completed",
        metadata: { finalOrder: current },
      });
    }, 800);
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      {config?.prompt && <h2 className="text-xl font-bold">{config.prompt}</h2>}
      <p className="text-sm text-muted-foreground">Coloque os passos na ordem certa usando as setas.</p>
      <ol className="flex flex-col gap-2">
        {current.map((id, i) => {
          const it = items.find((x) => x.id === id);
          const isRight = checked && correct[i] === id;
          const isWrong = checked && correct[i] !== id;
          return (
            <li
              key={id}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border-2 bg-background px-3 py-2",
                isRight ? "border-green-500 bg-green-50 dark:bg-green-950" : isWrong ? "border-red-500 bg-red-50 dark:bg-red-950" : "border-input",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">{i + 1}</span>
                {it?.emoji && <span className="text-2xl">{it.emoji}</span>}
                <span className="font-medium">{it?.label ?? id}</span>
              </div>
              {!checked && (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === current.length - 1} aria-label="Descer">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <Button size="lg" onClick={check} disabled={checked} className="self-end">
        Conferir
      </Button>
    </div>
  );
}

export const sequenceEngine: EngineDefinition<SequenceConfig> = {
  code: "sequence",
  name: "Sequência",
  listed: true,
  Component: SequenceGame,
  validateConfig: (cfg) => {
    const c = cfg as SequenceConfig;
    if (!c?.items || c.items.length < 2) return "Adicione ao menos 2 items.";
    if (!c?.order || c.order.length !== c.items.length) return "'order' precisa ter o mesmo tamanho de 'items'.";
    const ids = new Set(c.items.map((i) => i.id));
    if (c.order.some((id) => !ids.has(id))) return "Todo id em 'order' deve existir em 'items'.";
    return null;
  },
};
