import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Target, Trash2, TrendingUp, CheckCircle2, Pause } from "lucide-react";
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
  useGoals,
  useGoalProgress,
  useCreateGoal,
  useUpdateGoalStatus,
  useDeleteGoal,
  useLogGoalProgress,
} from "@/hooks/use-goals";
import { NoChildSelected } from "@/components/atlas/no-child-selected";
import type { Goal } from "@/modules/goals/api";

export const Route = createFileRoute("/app/objetivos")({
  head: () => ({
    meta: [
      { title: "Objetivos · Meu Mundo Azul" },
      {
        name: "description",
        content: "Objetivos terapêuticos e acompanhamento de progresso.",
      },
    ],
  }),
  component: GoalsPage,
});

const CATEGORIES = [
  { value: "communication", label: "Comunicação" },
  { value: "social", label: "Social" },
  { value: "motor", label: "Motor" },
  { value: "cognitive", label: "Cognitivo" },
  { value: "behavior", label: "Comportamento" },
  { value: "autonomy", label: "Autonomia" },
  { value: "general", label: "Geral" },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-primary-soft text-primary" },
  paused: { label: "Pausado", color: "bg-muted text-muted-foreground" },
  achieved: { label: "Conquistado", color: "bg-accent/40 text-accent-foreground" },
};

function GoalsPage() {
  const { activeChild } = useActiveChild();
  const { data: goals = [], isLoading } = useGoals(activeChild?.id);

  if (!activeChild) return <NoChildSelected />;

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
            Objetivos
          </h1>
          <p className="text-sm text-muted-foreground">
            Metas terapêuticas com acompanhamento contínuo.
          </p>
        </div>
        <NewGoalDialog childId={activeChild.id} />
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : goals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum objetivo cadastrado. Comece pelo primeiro.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} childId={activeChild.id} />
          ))}
        </ul>
      )}
    </div>
  );
}

function GoalCard({ goal, childId }: { goal: Goal; childId: string }) {
  const { data: progress = [] } = useGoalProgress(goal.id);
  const updateStatus = useUpdateGoalStatus(childId);
  const del = useDeleteGoal(childId);
  const log = useLogGoalProgress(childId, goal.id);
  const [note, setNote] = useState("");
  const [value, setValue] = useState("");

  const meta = STATUS_META[goal.status] ?? STATUS_META.active;

  function submitProgress() {
    log.mutate(
      {
        goal_id: goal.id,
        child_id: childId,
        value: value ? Number(value) : null,
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Progresso registrado");
          setNote("");
          setValue("");
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <li className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{goal.title}</p>
            <p className="mt-0.5 text-xs uppercase text-muted-foreground">
              {CATEGORIES.find((c) => c.value === goal.category)?.label ??
                goal.category}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${meta.color}`}>
          {meta.label}
        </span>
      </div>

      {goal.description && (
        <p className="mt-3 text-sm text-muted-foreground">{goal.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> {progress.length} registros
        </span>
        {goal.target_value != null && (
          <span>
            Meta: {goal.target_value} {goal.unit ?? ""}
          </span>
        )}
        {goal.due_date && (
          <span>
            Prazo: {new Date(goal.due_date).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex gap-2">
          <Input
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Valor"
            className="w-24"
          />
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota rápida do progresso"
          />
          <Button size="sm" onClick={submitProgress} disabled={log.isPending}>
            Registrar
          </Button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {goal.status !== "achieved" && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              updateStatus.mutate({ id: goal.id, status: "achieved" })
            }
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Conquistado
          </Button>
        )}
        {goal.status === "active" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateStatus.mutate({ id: goal.id, status: "paused" })}
          >
            <Pause className="mr-1.5 h-3.5 w-3.5" /> Pausar
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateStatus.mutate({ id: goal.id, status: "active" })}
          >
            Reativar
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() =>
            del.mutate(goal.id, { onSuccess: () => toast.success("Excluído") })
          }
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </li>
  );
}

function NewGoalDialog({ childId }: { childId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [due, setDue] = useState("");
  const create = useCreateGoal(childId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate(
      {
        child_id: childId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        target_value: target ? Number(target) : null,
        unit: unit.trim() || null,
        due_date: due || null,
      },
      {
        onSuccess: () => {
          toast.success("Objetivo criado");
          setOpen(false);
          setTitle("");
          setDescription("");
          setCategory("general");
          setTarget("");
          setUnit("");
          setDue("");
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Novo objetivo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo objetivo</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Manter contato visual por 5 segundos"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
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
              <Label>Prazo</Label>
              <Input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Meta numérica</Label>
              <Input
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="segundos, vezes, min"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Salvando…" : "Criar objetivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
