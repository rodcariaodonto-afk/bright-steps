import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BranchingChoice, BranchingConfig, StoryEngineProps } from "../types";

export function BranchingStory({ config, onFinish }: StoryEngineProps<BranchingConfig>) {
  const nodes = config?.nodes ?? [];
  const map = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [currentId, setCurrentId] = useState(config?.startId ?? nodes[0]?.id ?? "");
  const [visited, setVisited] = useState<string[]>([config?.startId ?? nodes[0]?.id].filter(Boolean) as string[]);
  const [reward, setReward] = useState(0);

  const node = map.get(currentId);
  if (nodes.length === 0) return <div className="p-6 text-center text-muted-foreground">História sem nós.</div>;
  if (!node) return <div className="p-6 text-center text-muted-foreground">Nó "{currentId}" não encontrado.</div>;

  const pick = (c: BranchingChoice) => {
    if (c.reward) setReward((r) => r + c.reward!);
    const next = map.get(c.next);
    if (!next) return onFinish({ completed: true, visited, reward });
    setVisited((v) => [...v, c.next]);
    setCurrentId(c.next);
  };

  const isEnding = node.ending || !node.choices || node.choices.length === 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="rounded-3xl bg-white/95 p-6 shadow-xl">
        {node.imageUrl ? (
          <img src={node.imageUrl} alt="" className="mx-auto mb-4 max-h-64 rounded-2xl object-cover" />
        ) : node.emoji ? (
          <div className="mb-4 text-center text-7xl">{node.emoji}</div>
        ) : null}
        <p className="whitespace-pre-wrap text-lg leading-relaxed text-[#0b2740]">{node.text}</p>
      </div>
      {isEnding ? (
        <div className="text-center">
          <Button size="lg" onClick={() => onFinish({ completed: true, visited, reward })}>
            Terminar história ⭐
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          {node.choices!.map((c, idx) => (
            <Button key={idx} variant="outline" className="h-auto whitespace-normal py-3 text-base" onClick={() => pick(c)}>
              {c.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
