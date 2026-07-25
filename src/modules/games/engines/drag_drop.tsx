import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EngineDefinition, EngineProps } from "./types";

interface DDItem {
  id: string;
  label: string;
  emoji?: string;
  correctBucket: string;
}
interface DDBucket {
  id: string;
  label: string;
  emoji?: string;
}
interface DragDropConfig {
  prompt?: string;
  buckets: DDBucket[];
  items: DDItem[];
}

function DragDropGame({ config, emit, onFinish }: EngineProps<DragDropConfig>) {
  const buckets = config?.buckets ?? [];
  const items = config?.items ?? [];

  // Placed: itemId -> bucketId
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const remaining = useMemo(() => items.filter((it) => !(it.id in placed)), [items, placed]);

  if (buckets.length === 0 || items.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">Configure buckets e items.</div>;
  }

  const place = (itemId: string, bucketId: string) => {
    if (placed[itemId]) return;
    const item = items.find((i) => i.id === itemId)!;
    const correct = item.correctBucket === bucketId;
    setPlaced((p) => ({ ...p, [itemId]: bucketId }));
    setSelected(null);
    emit({
      event_type: "item_dropped",
      payload: { itemId, bucketId, correct },
    });
    if (Object.keys(placed).length + 1 === items.length) {
      const score = items.filter((it) => (it.id === itemId ? correct : placed[it.id] === it.correctBucket)).length;
      setFinished(true);
      emit({ event_type: "round_completed", payload: { score, total: items.length } });
      setTimeout(() => {
        onFinish({ score, maxScore: items.length, status: "completed", metadata: { placed: { ...placed, [itemId]: bucketId } } });
      }, 400);
    }
  };

  const onDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDrop = (e: React.DragEvent, bucketId: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain");
    if (itemId) place(itemId, bucketId);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
      {config?.prompt && <h2 className="text-xl font-bold">{config.prompt}</h2>}

      {/* Itens disponíveis */}
      <div className="rounded-xl border-2 border-dashed border-input p-4">
        <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Arraste ou toque um item, depois toque no grupo</p>
        <div className="flex flex-wrap gap-2">
          {remaining.map((it) => (
            <button
              key={it.id}
              draggable={!finished}
              onDragStart={(e) => onDragStart(e, it.id)}
              onClick={() => setSelected((s) => (s === it.id ? null : it.id))}
              className={cn(
                "flex min-h-[56px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-base font-medium",
                selected === it.id ? "border-primary bg-primary/10" : "border-input bg-background hover:border-primary/50",
              )}
              aria-label={it.label}
            >
              {it.emoji && <span className="text-2xl">{it.emoji}</span>}
              <span>{it.label}</span>
            </button>
          ))}
          {remaining.length === 0 && <span className="text-sm text-muted-foreground">Todos classificados!</span>}
        </div>
      </div>

      {/* Buckets */}
      <div className={cn("grid gap-4", buckets.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
        {buckets.map((b) => {
          const inThis = Object.entries(placed).filter(([, bid]) => bid === b.id);
          return (
            <div
              key={b.id}
              onDrop={(e) => onDrop(e, b.id)}
              onDragOver={onDragOver}
              onClick={() => selected && place(selected, b.id)}
              className={cn(
                "min-h-[140px] rounded-2xl border-2 border-dashed p-4 transition-colors",
                selected ? "border-primary bg-primary/5 cursor-pointer" : "border-input",
              )}
            >
              <div className="mb-3 flex items-center gap-2">
                {b.emoji && <span className="text-2xl">{b.emoji}</span>}
                <h3 className="font-bold">{b.label}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {inThis.map(([iid]) => {
                  const it = items.find((x) => x.id === iid)!;
                  const correct = it.correctBucket === b.id;
                  return (
                    <span
                      key={iid}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-2 py-1 text-sm",
                        correct
                          ? "border-green-500 bg-green-50 dark:bg-green-950"
                          : "border-red-500 bg-red-50 dark:bg-red-950",
                      )}
                    >
                      {it.emoji && <span>{it.emoji}</span>}
                      <span>{it.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {finished && (
        <div className="text-center">
          <Button size="lg" onClick={() => onFinish({ score: items.filter((it) => placed[it.id] === it.correctBucket).length, maxScore: items.length, status: "completed" })}>
            Concluir
          </Button>
        </div>
      )}
    </div>
  );
}

export const dragDropEngine: EngineDefinition<DragDropConfig> = {
  code: "drag_drop",
  name: "Arrastar e Soltar",
  listed: true,
  Component: DragDropGame,
  validateConfig: (cfg) => {
    const c = cfg as DragDropConfig;
    if (!c?.buckets || c.buckets.length < 2) return "Adicione ao menos 2 buckets.";
    if (!c?.items || c.items.length < 2) return "Adicione ao menos 2 items.";
    const ids = new Set(c.buckets.map((b) => b.id));
    if (c.items.some((it) => !ids.has(it.correctBucket))) return "Todo item precisa apontar para um bucket existente.";
    return null;
  },
};
