import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Copy, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GameConfigBuilder } from "@/modules/games/admin/GameConfigBuilder";

export const Route = createFileRoute("/admin/games")({
  component: AdminGamesPage,
});

interface Engine {
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  config_schema: any;
  default_reward: number;
}

interface GameRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  engine_code: string | null;
  config: any;
  cover_url: string | null;
  stars_reward: number | null;
  age_min: number | null;
  age_max: number | null;
  tags: string[] | null;
  estimated_minutes: number | null;
  accessibility: any;
  published: boolean | null;
}

const emptyForm = (): Partial<GameRow> => ({
  slug: "",
  title: "",
  description: "",
  engine_code: null,
  config: {},
  cover_url: "",
  stars_reward: 5,
  age_min: 4,
  age_max: 10,
  tags: [],
  estimated_minutes: 5,
  difficulty: "easy",
  category: "",
  accessibility: { hasAudio: false, hasCaptions: false, highContrast: false, reducedMotion: false },
  published: true,
});

function AdminGamesPage() {
  const [engines, setEngines] = useState<Engine[]>([]);
  const [rows, setRows] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GameRow | null>(null);
  const [form, setForm] = useState<Partial<GameRow>>(emptyForm());
  const [configText, setConfigText] = useState("{}");
  const [configError, setConfigError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: e }, { data: g }] = await Promise.all([
      supabase.from("game_engines").select("*").order("name"),
      supabase.from("content_games").select("*").order("created_at", { ascending: false }),
    ]);
    setEngines((e ?? []) as Engine[]);
    setRows((g ?? []) as GameRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setConfigText("{}");
    setConfigError(null);
    setOpen(true);
  };
  const openEdit = (row: GameRow) => {
    setEditing(row);
    setForm({ ...row, tags: row.tags ?? [] });
    setConfigText(JSON.stringify(row.config ?? {}, null, 2));
    setConfigError(null);
    setOpen(true);
  };
  const duplicate = async (row: GameRow) => {
    const { id, ...rest } = row;
    const copy = { ...rest, slug: `${row.slug}-copia`, title: `${row.title} (cópia)`, published: false };
    const { error } = await supabase.from("content_games").insert(copy as any);
    if (error) return toast.error(error.message);
    toast.success("Duplicado");
    load();
  };
  const exportJson = (row: GameRow) => {
    const blob = new Blob([JSON.stringify(row, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${row.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      delete parsed.id;
      parsed.slug = `${parsed.slug || "importado"}-${Date.now()}`;
      const { error } = await supabase.from("content_games").insert(parsed);
      if (error) throw error;
      toast.success("Importado");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "JSON inválido");
    }
  };

  const remove = async (row: GameRow) => {
    if (!confirm(`Excluir "${row.title}"?`)) return;
    const { error } = await supabase.from("content_games").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    load();
  };

  const save = async () => {
    if (!form.slug || !form.title) return toast.error("Slug e título são obrigatórios");
    if (!form.engine_code) return toast.error("Escolha um motor");
    let cfg: any;
    try {
      cfg = JSON.parse(configText || "{}");
    } catch {
      setConfigError("JSON inválido");
      return;
    }
    setConfigError(null);
    setSaving(true);
    const payload = { ...form, config: cfg } as any;
    const q = editing
      ? supabase.from("content_games").update(payload).eq("id", editing.id)
      : supabase.from("content_games").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Atualizado" : "Criado");
    setOpen(false);
    load();
  };

  const selectedEngine = engines.find((e) => e.code === form.engine_code);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Jogos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada jogo é uma configuração JSON interpretada por um motor. Motores disponíveis: {" "}
            {engines.filter((e) => e.active).map((e) => e.name).join(", ") || "nenhum ativo"}.
          </p>
        </div>
        <div className="flex gap-2">
          <label className="inline-flex">
            <input type="file" accept="application/json" className="hidden"
              onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
            <Button variant="outline" asChild><span><Upload className="mr-2 h-4 w-4" />Importar JSON</span></Button>
          </label>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo jogo</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Nenhum jogo cadastrado.</Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => {
            const engine = engines.find((e) => e.code === row.engine_code);
            return (
              <Card key={row.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{row.title}</p>
                    {row.published ? <Badge variant="secondary">Publicado</Badge> : <Badge variant="outline">Rascunho</Badge>}
                    {engine ? (
                      <Badge className={engine.active ? "" : "bg-muted text-muted-foreground"}>
                        {engine.name}{!engine.active && " (motor inativo)"}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Sem motor</Badge>
                    )}
                  </div>
                  {row.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => duplicate(row)} title="Duplicar"><Copy className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => exportJson(row)} title="Exportar JSON"><Download className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(row)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => remove(row)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar jogo" : "Novo jogo"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Motor *</Label>
                <Select value={form.engine_code ?? ""} onValueChange={(v) => setForm({ ...form, engine_code: v })}>
                  <SelectTrigger><SelectValue placeholder="Escolha um motor" /></SelectTrigger>
                  <SelectContent>
                    {engines.map((e) => (
                      <SelectItem key={e.code} value={e.code}>{e.name}{!e.active && " (inativo)"}</SelectItem>
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
              <Label>Descrição</Label>
              <Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="grid gap-1.5"><Label>Idade mín</Label>
                <Input type="number" value={form.age_min ?? ""} onChange={(e) => setForm({ ...form, age_min: Number(e.target.value) || null })} /></div>
              <div className="grid gap-1.5"><Label>Idade máx</Label>
                <Input type="number" value={form.age_max ?? ""} onChange={(e) => setForm({ ...form, age_max: Number(e.target.value) || null })} /></div>
              <div className="grid gap-1.5"><Label>Tempo (min)</Label>
                <Input type="number" value={form.estimated_minutes ?? ""} onChange={(e) => setForm({ ...form, estimated_minutes: Number(e.target.value) || null })} /></div>
              <div className="grid gap-1.5"><Label>Estrelas</Label>
                <Input type="number" value={form.stars_reward ?? 5} onChange={(e) => setForm({ ...form, stars_reward: Number(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Categoria</Label>
                <Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Capa (URL)</Label>
                <Input value={form.cover_url ?? ""} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></div>
            </div>
            <div className="grid gap-1.5">
              <Label>Tags (separadas por vírgula)</Label>
              <Input value={(form.tags ?? []).join(", ")}
                onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </div>
            <div className="grid gap-1.5">
              <Label>
                Config JSON {selectedEngine && <span className="text-xs text-muted-foreground">(schema do motor {selectedEngine.name})</span>}
              </Label>
              <Textarea rows={10} className="font-mono text-xs"
                value={configText} onChange={(e) => setConfigText(e.target.value)} />
              {configError && <p className="text-xs text-destructive">{configError}</p>}
              {selectedEngine?.config_schema && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Ver JSON Schema esperado</summary>
                  <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2">{JSON.stringify(selectedEngine.config_schema, null, 2)}</pre>
                </details>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input id="published" type="checkbox" checked={!!form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              <Label htmlFor="published" className="cursor-pointer">Publicado</Label>
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
