import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { School as SchoolIcon, MessageSquarePlus, Pin } from "lucide-react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSession } from "@/hooks/use-session";
import { getProfessionalRepositories } from "@/modules/professional/repositories";
import {
  useSchools,
  useSchoolNotes,
  useCreateSchoolNote,
} from "@/hooks/use-school";
import type { SchoolNoteCategory } from "@/modules/school/api";

const patientsQuery = {
  queryKey: ["pro", "patients"],
  queryFn: () => getProfessionalRepositories().patients.list(),
};

export const Route = createFileRoute("/pro/escola")({
  loader: ({ context }) => context.queryClient.ensureQueryData(patientsQuery),
  component: SchoolPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Erro: {error.message}</div>
  ),
});

const CATEGORIES: Array<{ value: SchoolNoteCategory; label: string }> = [
  { value: "comunicado", label: "Comunicado" },
  { value: "comportamento", label: "Comportamento" },
  { value: "elogio", label: "Elogio" },
  { value: "ocorrencia", label: "Ocorrência" },
  { value: "tarefa", label: "Tarefa" },
  { value: "reuniao", label: "Reunião" },
  { value: "outro", label: "Outro" },
];

function SchoolPage() {
  const { data: patients } = useSuspenseQuery(patientsQuery);
  const { session } = useSession();
  const userId = session?.user.id;

  const [selectedChild, setSelectedChild] = useState<string>(
    patients[0]?.id ?? "",
  );
  const { data: schools = [] } = useSchools(selectedChild || null);
  const { data: notes = [], isLoading } = useSchoolNotes(
    selectedChild || null,
  );
  const createNote = useCreateSchoolNote(selectedChild || null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    school_id: "",
    category: "comunicado" as SchoolNoteCategory,
    title: "",
    content: "",
  });

  function submit() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }
    if (!userId || !selectedChild) return;
    createNote.mutate(
      {
        child_id: selectedChild,
        school_id: form.school_id || null,
        author_id: userId,
        author_role: "professional",
        category: form.category,
        title: form.title.trim(),
        content: form.content.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Anotação publicada");
          setOpen(false);
          setForm({
            school_id: "",
            category: "comunicado",
            title: "",
            content: "",
          });
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  if (patients.length === 0) {
    return (
      <ProPage
        title="Escola"
        subtitle="Comunicação entre profissional, família e escola."
      >
        <ProCard>
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum paciente vinculado. A família precisa cadastrar você em
            Configurações → Profissionais vinculados.
          </div>
        </ProCard>
      </ProPage>
    );
  }

  return (
    <ProPage
      title="Escola"
      subtitle="Comunicação entre profissional, família e escola."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-72">
          <Label className="text-xs">Paciente</Label>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!selectedChild}>
              <MessageSquarePlus className="mr-2 h-4 w-4" /> Nova anotação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publicar comunicação clínica</DialogTitle>
              <DialogDescription>
                Visível para a família e demais profissionais autorizados.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) =>
                      setForm({ ...form, category: v as SchoolNoteCategory })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Escola (opcional)</Label>
                  <Select
                    value={form.school_id || "none"}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        school_id: v === "none" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sem escola" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem escola</SelectItem>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Conteúdo</Label>
                <Textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={createNote.isPending}>
                Publicar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ProCard title="Escolas do paciente">
        {schools.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Nenhuma escola cadastrada pela família.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {schools.map((s) => (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-xl border border-border/60 p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <SchoolIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[s.grade, s.class_name].filter(Boolean).join(" · ") ||
                      "Sem turma"}
                    {s.teacher_name ? ` · Prof(a). ${s.teacher_name}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProCard>

      <ProCard title="Feed de comunicações">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : notes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Nenhuma comunicação registrada.
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((n) => (
              <article
                key={n.id}
                className="rounded-xl border border-border/60 bg-background p-4"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {CATEGORIES.find((c) => c.value === n.category)?.label ??
                      n.category}
                  </Badge>
                  {n.pinned && (
                    <Badge variant="outline" className="text-xs">
                      <Pin className="mr-1 h-3 w-3" /> Fixado
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {n.author_role === "family"
                      ? "Família"
                      : n.author_role === "professional"
                        ? "Profissional"
                        : "Escola"}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground">{n.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {n.content}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("pt-BR")}
                </p>
              </article>
            ))}
          </div>
        )}
      </ProCard>
    </ProPage>
  );
}
