import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useActiveChild } from "@/hooks/use-active-child";
import { useMoodLogs, useCreateMood } from "@/hooks/use-care";
import { NoChildSelected } from "@/components/atlas/no-child-selected";

export const Route = createFileRoute("/app/humor")({
  head: () => ({
    meta: [
      { title: "Humor · Meu Mundo Azul" },
      {
        name: "description",
        content: "Registro rápido do humor da criança ao longo do dia.",
      },
    ],
  }),
  component: MoodPage,
});

const LEVELS: Array<{ level: number; emoji: string; label: string }> = [
  { level: 1, emoji: "😢", label: "Muito difícil" },
  { level: 2, emoji: "😟", label: "Difícil" },
  { level: 3, emoji: "😐", label: "Neutro" },
  { level: 4, emoji: "🙂", label: "Bem" },
  { level: 5, emoji: "😄", label: "Ótimo" },
];

function MoodPage() {
  const { activeChild } = useActiveChild();
  const { data: logs = [], isLoading } = useMoodLogs(activeChild?.id);
  const create = useCreateMood(activeChild?.id);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<number | null>(null);

  if (!activeChild) return <NoChildSelected />;

  function log(level: number, emoji: string) {
    setPending(level);
    create.mutate(
      {
        child_id: activeChild!.id,
        level,
        emoji,
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Humor registrado");
          setNote("");
          setPending(null);
        },
        onError: (e) => {
          toast.error((e as Error).message);
          setPending(null);
        },
      },
    );
  }

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
          Humor
        </h1>
        <p className="text-sm text-muted-foreground">
          Toque no rostinho que representa este momento.
        </p>
      </header>

      <div className="mb-6 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="grid grid-cols-5 gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.level}
              disabled={create.isPending}
              onClick={() => log(l.level, l.emoji)}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-4 transition ${
                pending === l.level
                  ? "border-primary bg-primary-soft"
                  : "border-border/60 bg-background hover:border-primary/40"
              }`}
            >
              <span className="text-3xl">{l.emoji}</span>
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <Label>Contexto (opcional)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="O que aconteceu antes ou depois?"
          />
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-foreground">
          Histórico recente
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda sem registros.</p>
        ) : (
          <ul className="grid gap-2">
            {logs.map((l) => (
              <li
                key={l.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3"
              >
                <span className="text-2xl">{l.emoji ?? "•"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Nível {l.level}/5
                  </p>
                  {l.note && (
                    <p className="truncate text-xs text-muted-foreground">
                      {l.note}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(l.logged_at).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
