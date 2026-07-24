import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Baby,
  Plus,
  Trash2,
  Camera,
  Sparkles,
  Loader2,
  Pencil,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import {
  useFamily,
  useChildren,
  useCreateChild,
  useUpdateChild,
  useDeleteChild,
} from "@/hooks/use-family";
import { uploadChildAvatar, type Child, type ChildPronouns } from "@/modules/family/api";

const COMMON_CONDITIONS = [
  "TEA (Autismo)",
  "TDAH",
  "Dislexia",
  "Discalculia",
  "TOD",
  "Deficiência Intelectual",
  "Síndrome de Down",
  "Ansiedade",
  "Apraxia da fala",
];

const COMMON_INTERESTS = [
  "Dinossauros",
  "Espaço",
  "Trens",
  "Carros",
  "Princesas",
  "Super-heróis",
  "Animais",
  "Música",
  "Números",
  "Dinossauros marinhos",
];

export const Route = createFileRoute("/app/crianca")({
  head: () => ({
    meta: [
      { title: "Crianças · Meu Mundo Azul" },
      {
        name: "description",
        content:
          "Gerencie os perfis das crianças da sua família: dados básicos, condições e interesses.",
      },
    ],
  }),
  component: ChildrenPage,
});

function ChildrenPage() {
  const { data: family, isLoading: familyLoading } = useFamily();
  const { data: children = [], isLoading: childrenLoading } = useChildren(family?.id);

  if (familyLoading || childrenLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Família
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            Perfis das crianças
          </h1>
          <p className="mt-1 text-muted-foreground">
            Cada criança tem seu próprio painel, rotina e conversas com a Azul IA.
          </p>
        </div>
        <ChildFormDialog
          familyId={family?.id}
          trigger={
            <Button size="lg" className="rounded-full">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Adicionar criança
            </Button>
          }
        />
      </header>

      {children.length === 0 ? (
        <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-border p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Baby className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-6 font-display text-xl font-bold text-foreground">
            Nenhuma criança cadastrada
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Comece adicionando a primeira criança. Você poderá cadastrar mais depois
            e convidar responsáveis para participar do cuidado.
          </p>
          <ChildFormDialog
            familyId={family?.id}
            trigger={
              <Button size="lg" className="mt-6 rounded-full">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Adicionar primeira criança
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {children.map((c) => (
            <ChildCard key={c.id} child={c} familyId={family?.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChildCard({ child, familyId }: { child: Child; familyId: string | undefined }) {
  const [uploading, setUploading] = useState(false);
  const deleteMut = useDeleteChild(familyId);
  const updateMut = useUpdateChild(familyId);

  async function onAvatar(file: File) {
    setUploading(true);
    try {
      const url = await uploadChildAvatar(child.id, file);
      await updateMut.mutateAsync({ id: child.id, patch: {} as never });
      toast.success("Foto atualizada");
      void url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar foto");
    } finally {
      setUploading(false);
    }
  }

  const ageLabel = child.birth_date ? computeAge(child.birth_date) : null;

  return (
    <article className="flex flex-col rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="relative">
          {child.avatar_url ? (
            <img
              src={child.avatar_url}
              alt={child.full_name}
              className="h-16 w-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Baby className="h-7 w-7" aria-hidden="true" />
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
            {uploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Camera className="h-3 w-3" aria-hidden="true" />
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onAvatar(f);
              }}
            />
          </label>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-bold text-foreground">
            {child.nickname ?? child.full_name}
          </h3>
          {child.nickname ? (
            <p className="truncate text-xs text-muted-foreground">
              {child.full_name}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {ageLabel ?? "Sem data de nascimento"}
          </p>
        </div>
      </div>

      {child.declared_conditions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {child.declared_conditions.map((cond) => (
            <Badge key={cond} variant="secondary" className="text-[10px]">
              {cond}
            </Badge>
          ))}
        </div>
      ) : null}

      {child.dominant_interest ? (
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
          Interesse principal: <strong className="text-foreground">{child.dominant_interest}</strong>
        </p>
      ) : null}

      <div className="mt-6 flex gap-2">
        <ChildFormDialog
          familyId={familyId}
          existing={child}
          trigger={
            <Button variant="outline" size="sm" className="flex-1 rounded-full">
              <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Editar
            </Button>
          }
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="rounded-full text-destructive">
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover {child.nickname ?? child.full_name}?</AlertDialogTitle>
              <AlertDialogDescription>
                O perfil será arquivado. Você pode restaurá-lo depois entrando em contato
                com o suporte. Nenhum dado é excluído permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  try {
                    await deleteMut.mutateAsync(child.id);
                    toast.success("Perfil arquivado");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Falha ao arquivar");
                  }
                }}
              >
                Arquivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </article>
  );
}

function ChildFormDialog({
  familyId,
  existing,
  trigger,
}: {
  familyId: string | undefined;
  existing?: Child;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(existing?.full_name ?? "");
  const [nickname, setNickname] = useState(existing?.nickname ?? "");
  const [birthDate, setBirthDate] = useState(existing?.birth_date ?? "");
  const [pronouns, setPronouns] = useState<ChildPronouns | "">(
    (existing?.pronouns as ChildPronouns) ?? "",
  );
  const [conditions, setConditions] = useState<string[]>(
    existing?.declared_conditions ?? [],
  );
  const [interest, setInterest] = useState(existing?.dominant_interest ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const createMut = useCreateChild(familyId);
  const updateMut = useUpdateChild(familyId);
  const isEditing = !!existing;
  const busy = createMut.isPending || updateMut.isPending;

  function toggleCondition(c: string) {
    setConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Informe o nome completo");
      return;
    }
    const payload = {
      full_name: fullName.trim(),
      nickname: nickname.trim() || null,
      birth_date: birthDate || null,
      pronouns: (pronouns || null) as ChildPronouns | null,
      declared_conditions: conditions,
      dominant_interest: interest.trim() || null,
      notes: notes.trim() || null,
    };
    try {
      if (isEditing) {
        await updateMut.mutateAsync({ id: existing!.id, patch: payload });
        toast.success("Perfil atualizado");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Criança adicionada");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar criança" : "Adicionar criança"}
          </DialogTitle>
          <DialogDescription>
            Esses dados alimentam a rotina, a Azul IA e os relatórios clínicos.
            Você pode ajustar tudo depois.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nickname">Como é chamada</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Apelido carinhoso"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={birthDate ?? ""}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Pronomes</Label>
            <Select
              value={pronouns || undefined}
              onValueChange={(v) => setPronouns(v as ChildPronouns)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ele">Ele</SelectItem>
                <SelectItem value="ela">Ela</SelectItem>
                <SelectItem value="elu">Elu</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Condições declaradas</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CONDITIONS.map((c) => {
                const active = conditions.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleCondition(c)}
                    className={
                      active
                        ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                        : "rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground hover:bg-muted"
                    }
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Sem diagnóstico? Deixe em branco. Nada é enviado para terceiros.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="interest">Interesse dominante</Label>
            <Input
              id="interest"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              list="interests-list"
              placeholder="Ex.: Dinossauros"
            />
            <datalist id="interests-list">
              {COMMON_INTERESTS.map((i) => (
                <option key={i} value={i} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              A Azul IA usa esse tema para histórias, jogos e recompensas.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="O que profissionais e cuidadores precisam saber"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function computeAge(birthDate: string): string {
  const now = new Date();
  const bd = new Date(birthDate);
  const years = now.getFullYear() - bd.getFullYear();
  const monthsDiff = now.getMonth() - bd.getMonth();
  const adjusted =
    monthsDiff < 0 || (monthsDiff === 0 && now.getDate() < bd.getDate())
      ? years - 1
      : years;
  if (adjusted <= 0) {
    const totalMonths = Math.max(0, years * 12 + monthsDiff);
    return `${totalMonths} ${totalMonths === 1 ? "mês" : "meses"}`;
  }
  return `${adjusted} ${adjusted === 1 ? "ano" : "anos"}`;
}
