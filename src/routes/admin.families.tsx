import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { listAdminFamilies } from "@/modules/admin/api.functions";
import { createFamilyAsAdmin } from "@/modules/admin/people.functions";
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

export const Route = createFileRoute("/admin/families")({
  component: AdminFamilies,
});

function AdminFamilies() {
  const qc = useQueryClient();
  const fetchFamilies = useServerFn(listAdminFamilies);
  const createFn = useServerFn(createFamilyAsAdmin);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "families"],
    queryFn: () => fetchFamilies(),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", owner_email: "" });

  const createMut = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: () => {
      toast.success("Família criada");
      qc.invalidateQueries({ queryKey: ["admin", "families"] });
      setOpen(false);
      setForm({ name: "", owner_email: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminPage title="Famílias" description="Famílias ativas na plataforma.">
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova família</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar família</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome da família (ex: Família Silva)" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="E‑mail do responsável (owner)" value={form.owner_email}
                onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
              <p className="text-xs text-muted-foreground">O e‑mail precisa pertencer a um usuário já cadastrado.</p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMut.mutate()} disabled={!form.name || !form.owner_email || createMut.isPending}>
                {createMut.isPending ? "Criando…" : "Criar"}
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
              <th className="px-4 py-2">Responsável</th>
              <th className="px-4 py-2">Crianças</th>
              <th className="px-4 py-2">Criada em</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {data?.map((f) => (
              <tr key={f.id} className="border-t border-border/50">
                <td className="px-4 py-2 font-medium text-foreground">{f.name}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {f.owner?.full_name ?? f.owner?.email ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">{f.childrenCount}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Nenhuma família.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
