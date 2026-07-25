import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { listAdminUsers } from "@/modules/admin/api.functions";
import { createUserAsAdmin, updateUserRoles } from "@/modules/admin/system.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

const ROLE_OPTIONS = ["admin", "professional"];

function AdminUsers() {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listAdminUsers);
  const createFn = useServerFn(createUserAsAdmin);
  const updateRolesFn = useServerFn(updateUserRoles);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchUsers(),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", roles: [] as string[] });

  const createMut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          email: form.email,
          password: form.password,
          fullName: form.fullName || undefined,
          roles: form.roles,
        },
      }),
    onSuccess: () => {
      toast.success("Usuário criado");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setOpen(false);
      setForm({ email: "", password: "", fullName: "", roles: [] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rolesMut = useMutation({
    mutationFn: (v: { userId: string; roles: string[] }) => updateRolesFn({ data: v }),
    onSuccess: () => {
      toast.success("Papéis atualizados");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminPage title="Usuários" description="Últimos 200 usuários cadastrados.">
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar novo usuário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome completo" value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <Input placeholder="E‑mail" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Senha temporária (mín 8 caracteres)" type="text" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Papéis</p>
                <div className="flex gap-4">
                  {ROLE_OPTIONS.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.roles.includes(r)}
                        onCheckedChange={(v) =>
                          setForm({
                            ...form,
                            roles: v ? [...form.roles, r] : form.roles.filter((x) => x !== r),
                          })
                        }
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => createMut.mutate()}
                disabled={!form.email || form.password.length < 8 || createMut.isPending}
              >
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
              <th className="px-4 py-2">E‑mail</th>
              <th className="px-4 py-2">Papéis</th>
              <th className="px-4 py-2">Criado em</th>
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {data?.map((u) => (
              <tr key={u.id} className="border-t border-border/50">
                <td className="px-4 py-2 font-medium text-foreground">{u.full_name ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{u.email ?? "—"}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 ? (
                      <Badge variant="outline">user</Badge>
                    ) : (
                      u.roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    {ROLE_OPTIONS.map((r) => {
                      const has = u.roles.includes(r);
                      return (
                        <Button
                          key={r}
                          size="sm"
                          variant={has ? "default" : "outline"}
                          onClick={() =>
                            rolesMut.mutate({
                              userId: u.id,
                              roles: has ? u.roles.filter((x) => x !== r) : [...u.roles, r],
                            })
                          }
                        >
                          {has ? `− ${r}` : `+ ${r}`}
                        </Button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhum usuário.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
