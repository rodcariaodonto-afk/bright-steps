import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { listAdminUsers } from "@/modules/admin/api.functions";
import {
  createUserAsAdmin,
  grantComplimentary,
  updateUserRoles,
} from "@/modules/admin/system.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PUBLIC_PLANS } from "@/modules/billing/plans";
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
  const updateRolesFn = useServerFn(updateUserRoles);
  const createFn = useServerFn(createUserAsAdmin);
  const grantFn = useServerFn(grantComplimentary);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchUsers(),
  });


  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    kind: "family" as "family" | "professional" | "admin",
    grantFree: false,
    plan: "familia_plus" as string,
    expiresAt: "" as string,
    reason: "" as string,
  });

  const rolesFromKind = (kind: string) =>
    kind === "admin" ? ["admin"] : kind === "professional" ? ["professional"] : [];

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await createFn({
        data: {
          email: form.email,
          password: form.password,
          fullName: form.fullName || undefined,
          roles: rolesFromKind(form.kind),
        },
      });
      if (form.grantFree && res?.userId) {
        await grantFn({
          data: {
            userId: res.userId,
            plan: form.plan,
            expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
            reason: form.reason || "Cortesia concedida pelo admin",
          },
        });
      }
      return res;
    },
    onSuccess: () => {
      toast.success(
        form.grantFree ? "Usuário criado com acesso cortesia" : "Usuário criado",
      );
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setOpen(false);
      setForm({
        email: "",
        password: "",
        fullName: "",
        kind: "family",
        grantFree: false,
        plan: "familia_plus",
        expiresAt: "",
        reason: "",
      });
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
                <Label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Tipo de conta
                </Label>
                <Select
                  value={form.kind}
                  onValueChange={(v) => setForm({ ...form, kind: v as typeof form.kind })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Família / usuário comum</SelectItem>
                    <SelectItem value="professional">Profissional da saúde</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Famílias não precisam de papel especial, só uma conta ativa.
                </p>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={form.grantFree}
                    onCheckedChange={(v) => setForm({ ...form, grantFree: Boolean(v) })}
                  />
                  Conceder acesso gratuito (cortesia)
                </label>
                {form.grantFree && (
                  <div className="mt-3 space-y-2">
                    <Select
                      value={form.plan}
                      onValueChange={(v) => setForm({ ...form, plan: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {PUBLIC_PLANS.map((p) => (
                          <SelectItem key={p.code} value={p.code}>
                            {p.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                      placeholder="Expira em (opcional)"
                    />
                    <Input
                      placeholder="Motivo (ex: divulgação, teste, parceiro)"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    />
                  </div>
                )}
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
