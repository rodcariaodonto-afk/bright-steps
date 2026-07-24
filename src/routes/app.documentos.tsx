import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Loader2,
  FileImage,
  FileSpreadsheet,
  File as FileIcon,
} from "lucide-react";

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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useActiveChild } from "@/hooks/use-active-child";
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
} from "@/hooks/use-documents";
import {
  DOC_CATEGORIES,
  getDocumentUrl,
  type DocCategory,
  type ChildDocument,
} from "@/modules/documents/api";
import { NoChildSelected } from "@/components/atlas/no-child-selected";

export const Route = createFileRoute("/app/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos · Meu Mundo Azul" },
      {
        name: "description",
        content:
          "Guarde laudos, receitas, PEI e relatórios com segurança. Só quem você autorizar tem acesso.",
      },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const { activeChild } = useActiveChild();
  const { data: documents = [], isLoading } = useDocuments(activeChild?.id ?? null);
  const deleteMut = useDeleteDocument(activeChild?.id ?? null);

  if (!activeChild) {
    return (
      <NoChildSelected hint="Selecione uma criança para ver e enviar seus documentos." />
    );
  }

  async function open(doc: ChildDocument) {
    try {
      const url = await getDocumentUrl(doc.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao abrir");
    }
  }

  async function remove(doc: ChildDocument) {
    if (!confirm(`Remover "${doc.title}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await deleteMut.mutateAsync(doc);
      toast.success("Documento removido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao remover");
    }
  }

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Documentos
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">
            {activeChild.full_name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Laudos, receitas, PEI escolar e relatórios em um só lugar, com criptografia
            e acesso restrito.
          </p>
        </div>
        <UploadDialog childId={activeChild.id} />
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="group flex flex-col rounded-3xl border border-border/60 bg-card p-5 transition hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <DocIcon mime={doc.mime_type} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-foreground">
                    {doc.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {DOC_CATEGORIES.find((c) => c.value === doc.category)?.label ??
                        doc.category}
                    </Badge>
                    {doc.issued_at ? (
                      <span className="text-[10px] text-muted-foreground">
                        Emitido em {new Date(doc.issued_at).toLocaleDateString("pt-BR")}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              {doc.notes ? (
                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                  {doc.notes}
                </p>
              ) : null}
              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                <span>{formatSize(doc.size_bytes)}</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => open(doc)}
                    className="h-8"
                  >
                    <Download className="mr-1 h-3.5 w-3.5" /> Abrir
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Remover"
                    onClick={() => remove(doc)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <FileText className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-5 font-display text-lg font-bold text-foreground">
        Nenhum documento ainda
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Envie laudos, receitas ou PEI para consultar rapidamente e compartilhar com
        profissionais autorizados.
      </p>
    </div>
  );
}

function UploadDialog({ childId }: { childId: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocCategory>("laudo");
  const [issuedAt, setIssuedAt] = useState("");
  const [notes, setNotes] = useState("");
  const uploadMut = useUploadDocument(childId);

  function reset() {
    setFile(null);
    setTitle("");
    setCategory("laudo");
    setIssuedAt("");
    setNotes("");
  }

  async function submit() {
    if (!file || !title.trim()) {
      toast.error("Informe título e selecione um arquivo");
      return;
    }
    try {
      await uploadMut.mutateAsync({
        childId,
        file,
        title: title.trim(),
        category,
        issuedAt: issuedAt || null,
        notes: notes.trim() || undefined,
      });
      toast.success("Documento enviado");
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Upload className="mr-2 h-4 w-4" /> Enviar documento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo documento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc-file">Arquivo (PDF, imagem, planilha)</Label>
            <Input
              id="doc-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
              }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="doc-title">Título</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Laudo neuropsicológico 2025"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as DocCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-date">Data de emissão</Label>
              <Input
                id="doc-date"
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-notes">Observações (opcional)</Label>
            <Textarea
              id="doc-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexto, profissional responsável, próximos passos..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={uploadMut.isPending}>
            {uploadMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocIcon({ mime }: { mime: string | null }) {
  if (!mime) return <FileIcon className="h-5 w-5" />;
  if (mime.startsWith("image/")) return <FileImage className="h-5 w-5" />;
  if (mime.includes("sheet") || mime.includes("csv"))
    return <FileSpreadsheet className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
