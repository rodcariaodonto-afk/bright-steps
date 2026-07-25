import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { STORY_ENGINES } from "@/modules/stories/story-registry";
import { StoryConfigBuilder } from "@/modules/stories/admin/StoryConfigBuilder";
import type { StoryRow, StoryType } from "@/modules/stories/types";

export const Route = createFileRoute("/admin/stories")({
  component: AdminStoriesPage,
});

const emptyForm = (): Partial<StoryRow> => ({
  slug: "",
  title: "",
  summary: "",
  cover_url: "",
  story_type: "linear",
  config: STORY_ENGINES.linear.defaultConfig,
  stars_reward: 3,
  age_min: 3,
  age_max: 10,
  tags: [],
  published: true,
});

function AdminStoriesPage() {
  const [rows, setRows] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StoryRow | null>(null);
  const [form, setForm] = useState<Partial<StoryRow>>(emptyForm());
  const [configText, setConfigText] = useState("{}");
  const [configError, setConfigError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("content_stories").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as StoryRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    const f = emptyForm();
    setForm(f);
    setConfigText(JSON.stringify(f.config, null, 2));
    setConfigError(null);
    setOpen(true);
  };
  const openEdit = (row: StoryRow) => {
    setEditing(row);
    setForm({ ...row, tags: row.tags ?? [] });
    setConfigText(JSON.stringify(row.config ?? {}, null, 2));
    setConfigError(null);
    setOpen(true);
  };
  const duplicate = async (row: StoryRow) => {
    const { id, ...rest } = row;
    void id;
    const copy = { ...rest, slug: `${row.slug}-copia-${Date.now()}`, title: `${row.title} (cópia)`, published: false };
    const { error } = await supabase.from("content_stories").insert(copy as never);
    if (error) return toast.error(error.message);
    toast.success("Duplicado");
    load();
  };
  const remove = async (row: StoryRow) => {
    if (!confirm(`Excluir "${row.title}"?`)) return;
    const { error } = await supabase.from("content_stories").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    load();
  };
  const save = async () => {
    if (!form.slug || !form.title) return toast.error("Slug e título são obrigatórios");
    let cfg: unknown;
    try {
      cfg = JSON.parse(configText || "{}");
    } catch {
      setConfigError("JSON inválido");
      return;
    }
    setConfigError(null);
    setSaving(true);
    const payload = { ...form, config: cfg } as never;
    const q = editing
      ? supabase.from("content_stories").update(payload).eq("id", editing.id)
      : supabase.from("content_stories").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Atualizada" : "Criada");
    setOpen(false);
    load();
  };

  const changeType = (t: StoryType) => {
    const def = STORY_ENGINES[t].defaultConfig;
    setForm((f) => ({ ...f, story_type: t, config: def }));
    setConfigText(JSON.stringify(def, null, 2));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Histórias Interativas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Motores disponíveis: {Object.values(STORY_ENGINES).map((e) => e.label).join(", ")}.
          </p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova história</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Nenhuma história cadastrada.</Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <Card key={row.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{row.title}</p>
                  {row.published ? <Badge variant="secondary">Publicada</Badge> : <Badge variant="outline">Rascunho</Badge>}
                  <Badge>{STORY_ENGINES[row.story_type]?.label ?? row.story_type}</Badge>
                </div>
                {row.summary && <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.summary}</p>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => duplicate(row)} title="Duplicar"><Copy className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(row)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => remove(row)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar história" : "Nova história"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Tipo *</Label>
                <Select value={form.story_type ?? "linear"} onValueChange={(v) => changeType(v as StoryType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(STORY_ENGINES).map((e) => (
                      <SelectItem key={e.code} value={e.code}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Slug *</Label>
                <Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Título *</Label>
              <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Resumo</Label>
              <Textarea rows={2} value={form.summary ?? ""} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="grid gap-1.5"><Label>Idade mín</Label>
                <Input type="number" value={form.age_min ?? ""} onChange={(e) => setForm({ ...form, age_min: Number(e.target.value) || null })} /></div>
              <div className="grid gap-1.5"><Label>Idade máx</Label>
                <Input type="number" value={form.age_max ?? ""} onChange={(e) => setForm({ ...form, age_max: Number(e.target.value) || null })} /></div>
              <div className="grid gap-1.5"><Label>Estrelas</Label>
                <Input type="number" value={form.stars_reward ?? 3} onChange={(e) => setForm({ ...form, stars_reward: Number(e.target.value) || 0 })} /></div>
              <div className="grid gap-1.5"><Label>Capa (URL)</Label>
                <Input value={form.cover_url ?? ""} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></div>
            </div>
            <div className="grid gap-1.5">
              <Label>Tags (separadas por vírgula)</Label>
              <Input value={(form.tags ?? []).join(", ")}
                onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Conteúdo da história</Label>
              <Tabs defaultValue="visual">
                <TabsList>
                  <TabsTrigger value="visual">Editor visual</TabsTrigger>
                  <TabsTrigger value="json">JSON avançado</TabsTrigger>
                </TabsList>
                <TabsContent value="visual" className="mt-3">
                  <StoryConfigBuilder
                    storyType={form.story_type as StoryType}
                    config={(() => { try { return JSON.parse(configText || "{}"); } catch { return {}; } })()}
                    onChange={(next) => { setConfigText(JSON.stringify(next, null, 2)); setConfigError(null); }}
                  />
                </TabsContent>
                <TabsContent value="json" className="mt-3">
                  <Textarea rows={12} className="font-mono text-xs"
                    value={configText} onChange={(e) => setConfigText(e.target.value)} />
                  {configError && <p className="mt-1 text-xs text-destructive">{configError}</p>}
                </TabsContent>
              </Tabs>
            </div>
            <div className="flex items-center gap-2">
              <input id="pub" type="checkbox" checked={!!form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              <Label htmlFor="pub" className="cursor-pointer">Publicada</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
