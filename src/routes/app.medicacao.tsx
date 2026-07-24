import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pill, CheckCircle2, Trash2 } from "lucide-react";
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
  useMedications,
  useMedicationLogs,
  useCreateMedication,
  useArchiveMedication,
  useLogMedication,
} from "@/hooks/use-care";
import { NoChildSelected } from "@/components/atlas/no-child-selected";

export const Route = createFileRoute("/app/medicacao")({
  head: () => ({
    meta: [
      { title: "Medicação · Meu Mundo Azul" },
      {
        name: "description",
        content: "Cadastre remédios e registre cada tomada com segurança.",
      },
    ],
  }),
  component: MedicationPage,
});

function MedicationPage() {
  const { activeChild } = useActiveChild();
  const { data: meds = [], isLoading } = useMedications(activeChild?.id);
  const { data: logs = [] } = useMedicationLogs(activeChild?.id);
  const archive = useArchiveMedication(activeChild?.id);
  const log = useLogMedication(activeChild?.id);

  if (!activeChild) return <NoChildSelected />;

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
            Medicação
          </h1>
          <p className="text-sm text-muted-foreground">
            Registro seguro de cada dose. Os profissionais veem tudo.
          </p>
        </div>
        <NewMedDialog childId={activeChild.id} />
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : meds.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum medicamento ativo. Cadastre o primeiro.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {meds.map((m) => (
            <li
              key={m.id}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[m.dose, m.route, m.frequency].filter(Boolean).join(" · ")}
                    </p>
                    {m.prescriber && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Prescritor: {m.prescriber}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    archive.mutate(m.id, {
                      onSuccess: () => toast.success("Arquivado"),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <Button
                className="mt-3 w-full rounded-full"
                variant="secondary"
                onClick={() =>
                  log.mutate(
                    { medication_id: m.id, child_id: m.child_id },
                    {
                      onSuccess: () => toast.success("Dose registrada"),
                      onError: (e) => toast.error((e as Error).message),
                    },
                  )
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Registrar dose agora
              </Button>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-bold text-foreground">
          Últimas doses
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem registros ainda.
          </p>
        ) : (
          <ul className="grid gap-2">
            {logs.map((l) => {
              const med = meds.find((m) => m.id === l.medication_id);
              return (
                <li
                  key={l.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-2 text-sm"
                >
                  <span className="text-foreground">
                    {med?.name ?? "Medicamento"} — {l.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(l.taken_at).toLocaleString("pt-BR")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function NewMedDialog({ childId }: { childId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [route, setRoute] = useState("");
  const [frequency, setFrequency] = useState("");
  const [prescriber, setPrescriber] = useState("");
  const [notes, setNotes] = useState("");
  const create = useCreateMedication(childId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      {
        child_id: childId,
        name: name.trim(),
        dose: dose.trim() || null,
        route: route.trim() || null,
        frequency: frequency.trim() || null,
        prescriber: prescriber.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Medicamento cadastrado");
          setOpen(false);
          setName("");
          setDose("");
          setRoute("");
          setFrequency("");
          setPrescriber("");
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
          <Plus className="mr-2 h-4 w-4" /> Novo medicamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo medicamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Risperidona"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Dose</Label>
              <Input
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="5mg"
              />
            </div>
            <div className="space-y-2">
              <Label>Via</Label>
              <Input
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="Oral"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Input
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="1x ao dia"
            />
          </div>
          <div className="space-y-2">
            <Label>Prescritor</Label>
            <Input
              value={prescriber}
              onChange={(e) => setPrescriber(e.target.value)}
            />
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
              {create.isPending ? "Salvando…" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
