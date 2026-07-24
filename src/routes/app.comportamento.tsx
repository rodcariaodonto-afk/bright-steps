import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useActiveChild } from "@/hooks/use-active-child";
import { useBehaviorEvents, useCreateBehavior } from "@/hooks/use-care";
import { NoChildSelected } from "@/components/atlas/no-child-selected";

export const Route = createFileRoute("/app/comportamento")({
  head: () => ({
    meta: [
      { title: "Comportamento · Meu Mundo Azul" },
      {
        name: "description",
        content:
          "Registre eventos comportamentais no formato ABC (antecedente, comportamento, consequência).",
      },
    ],
  }),
  component: BehaviorPage,
});

const CATEGORIES = [
  { value: "positive", label: "Conquista" },
  { value: "breakthrough", label: "Marco" },
  { value: "stimming", label: "Autorregulação" },
  { value: "crisis", label: "Crise" },
  { value: "aggression", label: "Agressividade" },
  { value: "other", label: "Outro" },
];

function BehaviorPage() {
  const { activeChild } = useActiveChild();
  const { data: events = [], isLoading } = useBehaviorEvents(activeChild?.id);

  if (!activeChild) return <NoChildSelected />;

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
            Comportamento
          </h1>
          <p className="text-sm text-muted-foreground">
            Formato ABC: contexto, o que aconteceu, o que ajudou.
          </p>
        </div>
        <NewEventDialog childId={activeChild.id} />
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum evento registrado. Comece pelo primeiro.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {events.map((e) => (
            <li
              key={e.id}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                  {CATEGORIES.find((c) => c.value === e.category)?.label ??
                    e.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.occurred_at).toLocaleString("pt-BR")}
                </span>
              </div>
              {e.intensity && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Intensidade {e.intensity}/5
                  {e.duration_minutes ? ` · ${e.duration_minutes} min` : ""}
                </p>
              )}
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                {e.antecedent && (
                  <Cell label="Antecedente" value={e.antecedent} />
                )}
                {e.behavior && <Cell label="Comportamento" value={e.behavior} />}
                {e.consequence && (
                  <Cell label="Consequência" value={e.consequence} />
                )}
              </div>
              {e.note && (
                <p className="mt-3 text-sm text-muted-foreground">{e.note}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function NewEventDialog({ childId }: { childId: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("other");
  const [intensity, setIntensity] = useState(3);
  const [antecedent, setAntecedent] = useState("");
  const [behavior, setBehavior] = useState("");
  const [consequence, setConsequence] = useState("");
  const [note, setNote] = useState("");
  const create = useCreateBehavior(childId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      {
        child_id: childId,
        category,
        intensity,
        antecedent: antecedent.trim() || null,
        behavior: behavior.trim() || null,
        consequence: consequence.trim() || null,
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Evento registrado");
          setOpen(false);
          setAntecedent("");
          setBehavior("");
          setConsequence("");
          setNote("");
          setCategory("other");
          setIntensity(3);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Novo registro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar comportamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Intensidade ({intensity}/5)</Label>
              <input
                type="range"
                min={1}
                max={5}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Antecedente (o que veio antes)</Label>
            <Input
              value={antecedent}
              onChange={(e) => setAntecedent(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Comportamento</Label>
            <Input
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Consequência (o que aconteceu depois)</Label>
            <Input
              value={consequence}
              onChange={(e) => setConsequence(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Salvando…" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
