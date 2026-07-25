import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { listAdminChildren } from "@/modules/admin/api.functions";
import { createChildAsAdmin, listAllFamiliesLite } from "@/modules/admin/people.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/children")({
  component: AdminChildren,
});

function ageFrom(birth?: string | null) {
  if (!birth) return "—";
  const d = new Date(birth);
  const years = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  return `${years} anos`;
}

function AdminChildren() {
  const qc = useQueryClient();
  const fetchChildren = useServerFn(listAdminChildren);
  const fetchFamilies = useServerFn(listAllFamiliesLite);
  const createFn = useServerFn(createChildAsAdmin);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "children"],
    queryFn: () => fetchChildren(),
  });
  const { data: families } = useQuery({
    queryKey: ["admin", "families-lite"],
    queryFn: () => fetchFamilies(),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    family_id: "",
    full_name: "",
    nickname: "",
    birth_date: "",
    conditions: "",
  });

  const createMut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          family_id: form.family_id,
          full_name: form.full_name,
          nickname: form.nickname || undefined,
          birth_date: form.birth_date || undefined,
          declared_conditions: form.conditions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("Criança cadastrada");
      qc.invalidateQueries({ queryKey: ["admin", "children"] });
      setOpen(false);
      setForm({ family_id: "", full_name: "", nickname: "", birth_date: "", conditions: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminPage title="Crianças" description="Crianças cadastradas na plataforma.">
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova criança</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar criança</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.family_id} onValueChange={(v) => setForm({ ...form, family_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar família" /></SelectTrigger>
                <SelectContent>
                  {(families ?? []).map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Nome completo" value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <Input placeholder="Apelido (opcional)" value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
              <Input type="date" value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              <Input placeholder="Condições declaradas (separadas por vírgula)" value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMut.mutate()} disabled={!form.family_id || !form.full_name || createMut.isPending}>
                {createMut.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Apelido</th>
              <th className="px-4 py-2">Idade</th>
              <th className="px-4 py-2">Condições</th>
              <th className="px-4 py-2">Criada em</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {data?.map((c) => (
              <tr key={c.id} className="border-t border-border/50">
                <td className="px-4 py-2 font-medium text-foreground">{c.full_name}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.nickname ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{ageFrom(c.birth_date)}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {(c.declared_conditions ?? []).map((d: string) => (
                      <Badge key={d} variant="secondary">{d}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhuma criança.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
