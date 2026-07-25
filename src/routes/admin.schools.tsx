import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { listAdminSchools } from "@/modules/admin/api.functions";
import { createSchoolAsAdmin, listAllChildrenLite } from "@/modules/admin/people.functions";
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

export const Route = createFileRoute("/admin/schools")({
  component: AdminSchools,
});

function AdminSchools() {
  const qc = useQueryClient();
  const fetchSchools = useServerFn(listAdminSchools);
  const fetchChildren = useServerFn(listAllChildrenLite);
  const createFn = useServerFn(createSchoolAsAdmin);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "schools"],
    queryFn: () => fetchSchools(),
  });
  const { data: children } = useQuery({
    queryKey: ["admin", "children-lite"],
    queryFn: () => fetchChildren(),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    child_id: "",
    name: "",
    grade: "",
    class_name: "",
    teacher_name: "",
    teacher_email: "",
    phone: "",
  });

  const createMut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          child_id: form.child_id,
          name: form.name,
          grade: form.grade || undefined,
          class_name: form.class_name || undefined,
          teacher_name: form.teacher_name || undefined,
          teacher_email: form.teacher_email || undefined,
          phone: form.phone || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Escola vinculada");
      qc.invalidateQueries({ queryKey: ["admin", "schools"] });
      setOpen(false);
      setForm({ child_id: "", name: "", grade: "", class_name: "", teacher_name: "", teacher_email: "", phone: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminPage title="Escolas" description="Escolas vinculadas às crianças.">
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Vincular escola</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova escola</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.child_id} onValueChange={(v) => setForm({ ...form, child_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar criança" /></SelectTrigger>
                <SelectContent>
                  {(children ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Nome da escola" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Série" value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })} />
                <Input placeholder="Turma" value={form.class_name}
                  onChange={(e) => setForm({ ...form, class_name: e.target.value })} />
              </div>
              <Input placeholder="Nome do(a) professor(a)" value={form.teacher_name}
                onChange={(e) => setForm({ ...form, teacher_name: e.target.value })} />
              <Input placeholder="E‑mail do(a) professor(a)" value={form.teacher_email}
                onChange={(e) => setForm({ ...form, teacher_email: e.target.value })} />
              <Input placeholder="Telefone" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMut.mutate()} disabled={!form.child_id || !form.name || createMut.isPending}>
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
              <th className="px-4 py-2">Escola</th>
              <th className="px-4 py-2">Série / Turma</th>
              <th className="px-4 py-2">Professor(a)</th>
              <th className="px-4 py-2">Criança</th>
              <th className="px-4 py-2">Vinculada em</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {data?.map((s) => (
              <tr key={s.id} className="border-t border-border/50">
                <td className="px-4 py-2 font-medium text-foreground">{s.name}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {[s.grade, s.class_name].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {s.teacher_name ?? "—"}
                  {s.teacher_email ? <span className="block text-xs">{s.teacher_email}</span> : null}
                </td>
                <td className="px-4 py-2 text-muted-foreground">{s.childName}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhuma escola vinculada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
