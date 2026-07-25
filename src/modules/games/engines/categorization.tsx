import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EngineDefinition, EngineProps } from "./types";

interface CatItem {
  id: string;
  label: string;
  emoji?: string;
  correctCategory: string;
}
interface CatCategory {
  id: string;
  label: string;
  emoji?: string;
}
interface CategorizationConfig {
  prompt?: string;
  categories: CatCategory[];
  items: CatItem[];
  /** Se true, mostra 1 item por vez em vez do modo "todos visíveis". */
  oneAtATime?: boolean;
}

function CategorizationGame({ config, emit, onFinish }: EngineProps<CategorizationConfig>) {
  const cats = config?.categories ?? [];
  const items = config?.items ?? [];
  const oneAtATime = !!config?.oneAtATime;

  const order = useMemo(() => items.map((i) => i.id), [items]);
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean } | null>(null);

  if (cats.length < 2 || items.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">Configure categorias e items.</div>;
  }

  const remaining = items.filter((it) => !(it.id in placed));

  const currentItem = oneAtATime ? items[idx] : null;

  const choose = (itemId: string, catId: string) => {
    if (placed[itemId]) return;
    const it = items.find((x) => x.id === itemId)!;
    const ok = it.correctCategory === catId;
    setPlaced((p) => ({ ...p, [itemId]: catId }));
    setFeedback({ id: itemId, ok });
    emit({ event_type: "item_categorized", payload: { itemId, catId, correct: ok } });

    setTimeout(() => setFeedback(null), 700);

    const newCount = Object.keys(placed).length + 1;
    if (oneAtATime) {
      if (idx + 1 >= items.length) {
        setTimeout(() => finish({ ...placed, [itemId]: catId }), 500);
      } else {
        setTimeout(() => setIdx((i) => i + 1), 500);
      }
    } else if (newCount === items.length) {
      setTimeout(() => finish({ ...placed, [itemId]: catId }), 500);
    }
  };

  const finish = (finalPlaced: Record<string, string>) => {
    const score = items.filter((it) => finalPlaced[it.id] === it.correctCategory).length;
    emit({ event_type: "round_completed", payload: { score, total: items.length } });
    onFinish({ score, maxScore: items.length, status: "completed", metadata: { placed: finalPlaced } });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      {config?.prompt && <h2 className="text-xl font-bold">{config.prompt}</h2>}

      {oneAtATime ? (
        currentItem && (
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6 text-center">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Item {idx + 1} de {items.length}</p>
            <div className="text-5xl">{currentItem.emoji}</div>
            <p className="mt-2 text-xl font-bold">{currentItem.label}</p>
          </div>
        )
      ) : (
        <div className="rounded-xl border-2 border-dashed border-input p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Toque num item, depois na categoria</p>
          <div className="flex flex-wrap gap-2">
            {remaining.map((it) => (
              <button
                key={it.id}
                onClick={() => setIdx(items.indexOf(it))}
                className={cn(
                  "flex min-h-[56px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-base font-medium",
                  items[idx]?.id === it.id ? "border-primary bg-primary/10" : "border-input",
                )}
              >
                {it.emoji && <span className="text-2xl">{it.emoji}</span>}
                <span>{it.label}</span>
              </button>
            ))}
            {remaining.length === 0 && <span className="text-sm text-muted-foreground">Todos classificados!</span>}
          </div>
        </div>
      )}

      <div className={cn("grid gap-3", cats.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
        {cats.map((c) => {
          const targetItem = oneAtATime ? currentItem : items[idx];
          const disabled = !targetItem || !!placed[targetItem.id];
          return (
            <button
              key={c.id}
              onClick={() => targetItem && choose(targetItem.id, c.id)}
              disabled={disabled}
              className={cn(
                "flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 font-bold transition-transform",
                disabled ? "border-input opacity-60" : "border-primary/40 bg-background hover:scale-[1.02] hover:border-primary",
              )}
            >
              {c.emoji && <span className="text-3xl">{c.emoji}</span>}
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className={cn("rounded-xl p-3 text-center font-bold", feedback.ok ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200")}>
          {feedback.ok ? "Certo!" : "Ops, tenta de novo na próxima."}
        </div>
      )}

      {!oneAtATime && (
        <Button size="lg" onClick={() => finish(placed)} disabled={remaining.length > 0}>
          Finalizar
        </Button>
      )}
    </div>
  );
}

export const categorizationEngine: EngineDefinition<CategorizationConfig> = {
  code: "categorization",
  name: "Categorização",
  listed: true,
  Component: CategorizationGame,
  validateConfig: (cfg) => {
    const c = cfg as CategorizationConfig;
    if (!c?.categories || c.categories.length < 2) return "Adicione ao menos 2 categorias.";
    if (!c?.items || c.items.length < 2) return "Adicione ao menos 2 items.";
    const ids = new Set(c.categories.map((x) => x.id));
    if (c.items.some((it) => !ids.has(it.correctCategory))) return "Todo item precisa de correctCategory existente.";
    return null;
  },
};
