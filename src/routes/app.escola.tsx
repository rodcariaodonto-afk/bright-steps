import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  School as SchoolIcon,
  Plus,
  Trash2,
  Pin,
  PinOff,
  MessageSquarePlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { useActiveChild } from "@/hooks/use-active-child";
import { useSession } from "@/hooks/use-session";
import { NoChildSelected } from "@/components/atlas/no-child-selected";
import {
  useSchools,
  useCreateSchool,
  useDeleteSchool,
  useSchoolNotes,
  useCreateSchoolNote,
  useTogglePinNote,
  useDeleteSchoolNote,
} from "@/hooks/use-school";
import type { SchoolNoteCategory } from "@/modules/school/api";

export const Route = createFileRoute("/app/escola")({
  head: () => ({
    meta: [
      { title: "Escola · Meu Mundo Azul" },
      {
        name: "description",
        content:
          "Comunicação entre família, escola e profissionais em um só lugar.",
      },
    ],
  }),
  component: SchoolPage,
});

const CATEGORIES: Array<{ value: SchoolNoteCategory; label: string; color: string }> = [
  { value: "comunicado", label: "Comunicado", color: "bg-blue-100 text-blue-800" },
  { value: "comportamento", label: "Comportamento", color: "bg-amber-100 text-amber-800" },
  { value: "elogio", label: "Elogio", color: "bg-emerald-100 text-emerald-800" },
  { value: "ocorrencia", label: "Ocorrência", color: "bg-rose-100 text-rose-800" },
  { value: "tarefa", label: "Tarefa", color: "bg-violet-100 text-violet-800" },
  { value: "reuniao", label: "Reunião", color: "bg-cyan-100 text-cyan-800" },
  { value: "outro", label: "Outro", color: "bg-slate-100 text-slate-800" },
];

function catLabel(v: string) {
  return CATEGORIES.find((c) => c.value === v)?.label ?? v;
}
function catColor(v: string) {
  return CATEGORIES.find((c) => c.value === v)?.color ?? "bg-slate-100 text-slate-800";
}

function SchoolPage() {
  const { activeChild } = useActiveChild();
  const { session } = useSession();
  const userId = session?.user.id;

  const { data: schools = [] } = useSchools(activeChild?.id);
  const [filterSchool, setFilterSchool] = useState<string>("all");
  const { data: notes = [], isLoading } = useSchoolNotes(
    activeChild?.id,
    filterSchool === "all" ? null : filterSchool,
  );

  const createSchool = useCreateSchool(activeChild?.id);
  const deleteSchool = useDeleteSchool(activeChild?.id);
  const createNote = useCreateSchoolNote(activeChild?.id);
  const togglePin = useTogglePinNote(activeChild?.id);
  const deleteNote = useDeleteSchoolNote(activeChild?.id);

  // school dialog
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [schoolForm, setSchoolForm] = useState({
    name: "",
    teacher_name: "",
    teacher_email: "",
    grade: "",
    class_name: "",
    phone: "",
    notes: "",
  });

  // note dialog
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({
    school_id: "",
    category: "comunicado" as SchoolNoteCategory,
    title: "",
    content: "",
  });

  const groupedByPin = useMemo(() => {
    const pinned = notes.filter((n) => n.pinned);
    const rest = notes.filter((n) => !n.pinned);
    return { pinned, rest };
  }, [notes]);

  if (!activeChild) return <NoChildSelected />;

  function submitSchool() {
    if (!schoolForm.name.trim()) {
      toast.error("Nome da escola é obrigatório");
      return;
    }
    createSchool.mutate(
      {
        child_id: activeChild!.id,
        name: schoolForm.name.trim(),
        teacher_name: schoolForm.teacher_name.trim() || null,
        teacher_email: schoolForm.teacher_email.trim() || null,
        grade: schoolForm.grade.trim() || null,
        class_name: schoolForm.class_name.trim() || null,
        phone: schoolForm.phone.trim() || null,
        notes: schoolForm.notes.trim() || null,
        created_by: userId ?? null,
      },
      {
        onSuccess: () => {
          toast.success("Escola cadastrada");
          setSchoolOpen(false);
          setSchoolForm({
            name: "",
            teacher_name: "",
            teacher_email: "",
            grade: "",
            class_name: "",
            phone: "",
            notes: "",
          });
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  function submitNote() {
    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }
    if (!userId) {
      toast.error("Sessão expirada");
      return;
    }
    createNote.mutate(
      {
        child_id: activeChild!.id,
        school_id: noteForm.school_id || null,
        author_id: userId,
        author_role: "family",
        category: noteForm.category,
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Anotação registrada");
          setNoteOpen(false);
          setNoteForm({
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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Escola</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ponte entre {activeChild.fullName}, a escola e os profissionais.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={schoolOpen} onOpenChange={setSchoolOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <SchoolIcon className="mr-2 h-4 w-4" /> Nova escola
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar escola</DialogTitle>
                <DialogDescription>
                  Vincule uma escola a {activeChild.fullName}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>Nome da escola *</Label>
                  <Input
                    value={schoolForm.name}
                    onChange={(e) =>
                      setSchoolForm({ ...schoolForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Série / Ano</Label>
                    <Input
                      value={schoolForm.grade}
                      onChange={(e) =>
                        setSchoolForm({ ...schoolForm, grade: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Turma</Label>
                    <Input
                      value={schoolForm.class_name}
                      onChange={(e) =>
                        setSchoolForm({ ...schoolForm, class_name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Professor(a) de referência</Label>
                  <Input
                    value={schoolForm.teacher_name}
                    onChange={(e) =>
                      setSchoolForm({ ...schoolForm, teacher_name: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Email do professor</Label>
                    <Input
                      type="email"
                      value={schoolForm.teacher_email}
                      onChange={(e) =>
                        setSchoolForm({
                          ...schoolForm,
                          teacher_email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={schoolForm.phone}
                      onChange={(e) =>
                        setSchoolForm({ ...schoolForm, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    rows={3}
                    value={schoolForm.notes}
                    onChange={(e) =>
                      setSchoolForm({ ...schoolForm, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={submitSchool}
                  disabled={createSchool.isPending}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <MessageSquarePlus className="mr-2 h-4 w-4" /> Nova anotação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar comunicação</DialogTitle>
                <DialogDescription>
                  Toda anotação é compartilhada com profissionais autorizados.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={noteForm.category}
                      onValueChange={(v) =>
                        setNoteForm({ ...noteForm, category: v as SchoolNoteCategory })
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
                      value={noteForm.school_id || "none"}
                      onValueChange={(v) =>
                        setNoteForm({
                          ...noteForm,
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
                    value={noteForm.title}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Conteúdo</Label>
                  <Textarea
                    rows={5}
                    value={noteForm.content}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, content: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submitNote} disabled={createNote.isPending}>
                  Publicar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Schools list */}
      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Escolas vinculadas
          </h2>
          <span className="text-xs text-muted-foreground">
            {schools.length} cadastrada(s)
          </span>
        </div>
        {schools.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma escola cadastrada ainda.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {schools.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <SchoolIcon className="h-4 w-4" />
                    </div>
                    <p className="truncate font-semibold text-foreground">
                      {s.name}
                    </p>
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    {(s.grade || s.class_name) && (
                      <p>
                        {[s.grade, s.class_name].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {s.teacher_name && <p>Prof(a). {s.teacher_name}</p>}
                    {s.teacher_email && <p>{s.teacher_email}</p>}
                    {s.phone && <p>{s.phone}</p>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Remover escola ${s.name}?`)) {
                      deleteSchool.mutate(s.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Notes */}
      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Comunicações
          </h2>
          {schools.length > 0 && (
            <div className="w-56">
              <Select value={filterSchool} onValueChange={setFilterSchool}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as escolas</SelectItem>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : notes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma anotação ainda. Comece registrando um comunicado, elogio ou
            ocorrência.
          </p>
        ) : (
          <div className="space-y-3">
            {[...groupedByPin.pinned, ...groupedByPin.rest].map((n) => {
              const school = schools.find((s) => s.id === n.school_id);
              return (
                <article
                  key={n.id}
                  className="rounded-xl border border-border/60 bg-background p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge className={catColor(n.category)} variant="secondary">
                          {catLabel(n.category)}
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
                      <h3 className="font-semibold text-foreground">
                        {n.title}
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {n.content}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString("pt-BR")}
                        {school ? ` · ${school.name}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          togglePin.mutate({ id: n.id, pinned: !n.pinned })
                        }
                        title={n.pinned ? "Desafixar" : "Fixar"}
                      >
                        {n.pinned ? (
                          <PinOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Pin className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      {n.author_id === userId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Remover esta anotação?")) {
                              deleteNote.mutate(n.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// avoid unused import warning
export const _p = Plus;
