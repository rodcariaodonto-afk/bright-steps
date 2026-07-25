import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EngineDefinition, EngineProps } from "./types";

interface Choice {
  label: string;
  next: string;
  /** 0..1 (opcional). Padrão 0. Somado ao score final. */
  reward?: number;
}
interface StoryNode {
  id: string;
  text: string;
  emoji?: string;
  imageUrl?: string;
  choices?: Choice[];
  /** Se true, este nó encerra a história. */
  ending?: boolean;
}
interface BranchingStoryConfig {
  startId: string;
  nodes: StoryNode[];
}

function BranchingStoryGame({ config, emit, onFinish }: EngineProps<BranchingStoryConfig>) {
  const nodes = config?.nodes ?? [];
  const map = new Map(nodes.map((n) => [n.id, n]));
  const [currentId, setCurrentId] = useState<string>(config?.startId ?? nodes[0]?.id ?? "");
  const [totalReward, setTotalReward] = useState(0);
  const [visited, setVisited] = useState<string[]>([]);

  const node = map.get(currentId);

  useEffect(() => {
    if (node) {
      setVisited((v) => (v[v.length - 1] === node.id ? v : [...v, node.id]));
      emit({ event_type: "node_shown", payload: { nodeId: node.id } });
    }
  }, [node?.id, emit, node]);

  if (nodes.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">História sem nós configurados.</div>;
  }
  if (!node) {
    return <div className="p-8 text-center text-muted-foreground">Nó "{currentId}" não encontrado.</div>;
  }

  const finish = () => {
    const maxScore = Math.max(1, nodes.filter((n) => n.ending).length);
    const score = Math.min(maxScore, Math.round(totalReward));
    onFinish({
      score: score || 1,
      maxScore: Math.max(maxScore, 1),
      status: "completed",
      metadata: { visited: [...visited, node.id], reward: totalReward },
    });
  };

  const pick = (c: Choice) => {
    emit({ event_type: "choice_made", payload: { from: node.id, to: c.next, label: c.label } });
    if (c.reward) setTotalReward((r) => r + c.reward!);
    const nextNode = map.get(c.next);
    if (!nextNode) {
      // Encerra graciosamente
      finish();
      return;
    }
    setCurrentId(c.next);
  };

  const isEnding = node.ending || !node.choices || node.choices.length === 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      {node.imageUrl ? (
        <img src={node.imageUrl} alt="" className="mx-auto max-h-64 rounded-2xl object-cover" />
      ) : node.emoji ? (
        <div className="text-center text-7xl">{node.emoji}</div>
      ) : null}

      <p className="text-lg leading-relaxed">{node.text}</p>

      {isEnding ? (
        <div className="text-center">
          <div className="mb-3 text-4xl">✨</div>
          <p className="mb-4 font-bold">Fim desta história.</p>
          <Button size="lg" onClick={finish}>Concluir</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {node.choices!.map((c, i) => (
            <button
              key={i}
              onClick={() => pick(c)}
              className={cn(
                "min-h-[56px] rounded-xl border-2 border-input bg-background px-4 py-3 text-left text-base font-medium",
                "hover:border-primary hover:bg-primary/5",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const branchingStoryEngine: EngineDefinition<BranchingStoryConfig> = {
  code: "branching_story",
  name: "História Ramificada",
  listed: true,
  Component: BranchingStoryGame,
  validateConfig: (cfg) => {
    const c = cfg as BranchingStoryConfig;
    if (!c?.nodes || c.nodes.length === 0) return "Adicione ao menos 1 nó em 'nodes'.";
    if (!c.startId || !c.nodes.find((n) => n.id === c.startId)) return "'startId' precisa apontar para um nó existente.";
    const ids = new Set(c.nodes.map((n) => n.id));
    for (const n of c.nodes) {
      for (const ch of n.choices ?? []) {
        if (!ids.has(ch.next)) return `Escolha aponta para nó inexistente: ${ch.next}`;
      }
    }
    return null;
  },
};
