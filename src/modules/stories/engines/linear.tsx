import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { LinearConfig, StoryEngineProps } from "../types";

export function LinearStory({ config, onFinish }: StoryEngineProps<LinearConfig>) {
  const pages = config?.pages ?? [];
  const [i, setI] = useState(0);
  if (pages.length === 0) {
    return <div className="p-6 text-center text-muted-foreground">História sem páginas.</div>;
  }
  const page = pages[i];
  const isLast = i === pages.length - 1;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="rounded-3xl bg-white/95 p-6 shadow-xl">
        {page.imageUrl ? (
          <img src={page.imageUrl} alt="" className="mx-auto mb-4 max-h-64 rounded-2xl object-cover" />
        ) : page.emoji ? (
          <div className="mb-4 text-center text-7xl">{page.emoji}</div>
        ) : null}
        <p className="whitespace-pre-wrap text-lg leading-relaxed text-[#0b2740]">{page.text}</p>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>
          ← Anterior
        </Button>
        <span className="text-sm font-bold text-[#0b2740]/70">
          {i + 1} / {pages.length}
        </span>
        {isLast ? (
          <Button onClick={() => onFinish({ completed: true, reward: 1 })}>Terminar ⭐</Button>
        ) : (
          <Button onClick={() => setI((v) => v + 1)}>Próxima →</Button>
        )}
      </div>
    </div>
  );
}
