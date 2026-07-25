import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "tags";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  default?: any;
}

interface Props {
  title: string;
  description?: string;
  table: string;
  fields: FieldDef[];
  displayField: string;
  subtitleField?: string;
  orderBy?: string;
  orderAsc?: boolean;
}

export function ContentCrud({
  title,
  description,
  table,
  fields,
  displayField,
  subtitleField,
  orderBy = "created_at",
  orderAsc = false,
}: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table as any).select("*").order(orderBy, { ascending: orderAsc });
    if (error) toast.error("Erro ao carregar: " + error.message);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [table]);

  const openNew = () => {
    const initial: Record<string, any> = {};
    fields.forEach((f) => (initial[f.name] = f.default ?? (f.type === "boolean" ? true : f.type === "number" ? 0 : f.type === "tags" ? "" : "")));
    setForm(initial);
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (row: any) => {
    const initial: Record<string, any> = {};
    fields.forEach((f) => {
      const v = row[f.name];
      initial[f.name] = f.type === "tags" ? (Array.isArray(v) ? v.join(", ") : v ?? "") : v ?? (f.type === "boolean" ? false : f.type === "number" ? 0 : "");
    });
    setForm(initial);
    setEditing(row);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const payload: Record<string, any> = {};
    for (const f of fields) {
      let v = form[f.name];
      if (f.type === "tags") v = String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (f.type === "number") v = Number(v) || 0;
      if (f.required && (v === "" || v == null)) { toast.error(`${f.label} é obrigatório`); setSaving(false); return; }
      payload[f.name] = v;
    }
    const q = editing
      ? supabase.from(table as any).update(payload).eq("id", editing.id)
      : supabase.from(table as any).insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(editing ? "Atualizado" : "Criado");
    setOpen(false);
    load();
  };

  const remove = async (row: any) => {
    if (!confirm(`Excluir "${row[displayField]}"?`)) return;
    const { error } = await supabase.from(table as any).delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    load();
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Novo</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Nenhum item cadastrado. Clique em "Novo" para começar.</Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <Card key={row.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{row[displayField] || "(sem título)"}</p>
                {subtitleField && row[subtitleField] && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{String(row[subtitleField])}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(row)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => remove(row)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            {fields.map((f) => (
              <div key={f.name} className="grid gap-1.5">
                <Label htmlFor={f.name}>{f.label}{f.required && " *"}</Label>
                {f.type === "textarea" ? (
                  <Textarea id={f.name} rows={5} placeholder={f.placeholder} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                ) : f.type === "boolean" ? (
                  <select id={f.name} className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={String(form[f.name] ?? false)} onChange={(e) => setForm({ ...form, [f.name]: e.target.value === "true" })}>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                ) : (
                  <Input id={f.name} type={f.type === "number" ? "number" : "text"} placeholder={f.placeholder} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                )}
              </div>
            ))}
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
