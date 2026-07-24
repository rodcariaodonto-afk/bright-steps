import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, CheckCircle2, Circle, Trash2, Clock } from "lucide-react";
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
import {
  useRoutines,
  useCompletionsToday,
  useCreateRoutine,
  useArchiveRoutine,
  useToggleRoutine,
} from "@/hooks/use-care";
import { NoChildSelected } from "@/components/atlas/no-child-selected";

export const Route = createFileRoute("/app/rotinas")({
  head: () => ({
    meta: [
      { title: "Rotinas · Meu Mundo Azul" },
      {
        name: "description",
        content: "Rotina diária com horário e marcação de conclusão.",
      },
    ],
  }),
  component: RoutinesPage,
});

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const CATEGORIES = [
  { value: "morning", label: "Manhã" },
  { value: "school", label: "Escola" },
  { value: "therapy", label: "Terapia" },
  { value: "daily", label: "Diária" },
  { value: "night", label: "Noite" },
];

function RoutinesPage() {
  const { activeChild } = useActiveChild();
  const { data: routines = [], isLoading } = useRoutines(activeChild?.id);
  const { data: completions = [] } = useCompletionsToday(activeChild?.id);
  const toggle = useToggleRoutine(activeChild?.id);
  const archive = useArchiveRoutine(activeChild?.id);

  const doneIds = new Set(completions.map((c) => c.routine_id));

  if (!activeChild) return <NoChildSelected />;

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
            Rotinas de {activeChild.nickname ?? activeChild.full_name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Marque o que aconteceu hoje. A Azul IA aprende com o ritmo.
          </p>
        </div>
        <NewRoutineDialog childId={activeChild.id} />
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : routines.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma rotina cadastrada ainda. Comece pela primeira.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {routines.map((r) => {
            const done = doneIds.has(r.id);
            return (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
              >
                <button
                  className="flex flex-1 items-center gap-3 text-left"
                  onClick={() =>
                    toggle.mutate({ routine: r, done: !done }, {
                      onError: (e: unknown) =>
                        toast.error((e as Error).message),
                    })
                  }
                >
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={
                        done
                          ? "font-medium text-muted-foreground line-through"
                          : "font-medium text-foreground"
                      }
                    >
                      {r.title}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      {r.time_of_day && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {r.time_of_day.slice(0, 5)}
                        </span>
                      )}
                      <span className="uppercase">{r.category}</span>
                      <span>{r.days_of_week.map((d) => DAYS[d]).join(" ")}</span>
                    </p>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    archive.mutate(r.id, {
                      onSuccess: () => toast.success("Rotina arquivada"),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NewRoutineDialog({ childId }: { childId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("daily");
  const [notes, setNotes] = useState("");
  const create = useCreateRoutine(childId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate(
      {
        child_id: childId,
        title: title.trim(),
        category,
        time_of_day: time || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Rotina criada");
          setOpen(false);
          setTitle("");
          setTime("");
          setNotes("");
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Nova rotina
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova rotina</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escovar os dentes"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
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
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Salvando…" : "Criar rotina"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
