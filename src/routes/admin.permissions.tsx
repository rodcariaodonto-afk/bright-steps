import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminPage } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  createUserAsAdmin,
  inviteUserAsAdmin,
  updateUserRoles,
  suspendUser,
  unsuspendUser,
  deleteUserAsAdmin,
  grantComplimentary,
} from "@/modules/admin/system.functions";
import { listAdminUsers } from "@/modules/admin/api.functions";
import { UserPlus, Mail, Shield, Ban, Trash2, Gift } from "lucide-react";

export const Route = createFileRoute("/admin/permissions")({
  component: AdminPermissions,
});

const ALL_ROLES = ["admin", "moderator", "professional"] as const;

function AdminPermissions() {
  const fetchUsers = useServerFn(listAdminUsers);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchUsers(),
  });

  const filtered = (data ?? []).filter((u: any) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminPage
      title="Permissões & Usuários"
      description="Gerencie papéis (RBAC), crie contas manualmente e conceda assinaturas de cortesia."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e,mail…"
          className="max-w-sm"
        />
        <div className="ml-auto flex gap-2">
          <CreateUserDialog onDone={() => qc.invalidateQueries({ queryKey: ["admin", "users"] })} />
          <InviteUserDialog onDone={() => qc.invalidateQueries({ queryKey: ["admin", "users"] })} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">E,mail</th>
              <th className="px-4 py-2">Papéis</th>
              <th className="px-4 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {filtered.map((u: any) => (
              <UserRow key={u.id} user={u} onChange={() => qc.invalidateQueries({ queryKey: ["admin", "users"] })} />
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Nenhum usuário.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}

function UserRow({ user, onChange }: { user: any; onChange: () => void }) {
  const updateRoles = useServerFn(updateUserRoles);
  const suspend = useServerFn(suspendUser);
  const unsuspend = useServerFn(unsuspendUser);
  const removeUser = useServerFn(deleteUserAsAdmin);

  const toggle = useMutation({
    mutationFn: async (role: string) => {
      const has = user.roles.includes(role);
      const next = has ? user.roles.filter((r: string) => r !== role) : [...user.roles, role];
      return updateRoles({ data: { userId: user.id, roles: next } });
    },
    onSuccess: () => { toast.success("Papéis atualizados"); onChange(); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  return (
    <tr className="border-t border-border/50">
      <td className="px-4 py-2 font-medium text-foreground">{user.full_name ?? "—"}</td>
      <td className="px-4 py-2 text-muted-foreground">{user.email ?? "—"}</td>
      <td className="px-4 py-2">
        <div className="flex flex-wrap gap-1">
          {ALL_ROLES.map((role) => {
            const active = user.roles.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggle.mutate(role)}
                disabled={toggle.isPending}
                className="focus:outline-none"
              >
                <Badge variant={active ? "default" : "outline"} className="cursor-pointer">
                  {role}
                </Badge>
              </button>
            );
          })}
        </div>
      </td>
      <td className="px-4 py-2">
        <div className="flex justify-end gap-1">
          <GrantComplimentaryDialog userId={user.id} userLabel={user.email ?? user.full_name ?? user.id} onDone={onChange} />
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try {
                await suspend({ data: { userId: user.id, hours: 24 * 7 } });
                toast.success("Suspenso por 7 dias");
                onChange();
              } catch (e: any) { toast.error(e.message ?? "Erro"); }
            }}
          >
            <Ban className="mr-1 h-3 w-3" /> Suspender 7d
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try {
                await unsuspend({ data: { userId: user.id } });
                toast.success("Reativado");
                onChange();
              } catch (e: any) { toast.error(e.message ?? "Erro"); }
            }}
          >
            Reativar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={async () => {
              if (!confirm(`Excluir ${user.email}? Esta ação não pode ser desfeita.`)) return;
              try {
                await removeUser({ data: { userId: user.id } });
                toast.success("Excluído");
                onChange();
              } catch (e: any) { toast.error(e.message ?? "Erro"); }
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function CreateUserDialog({ onDone }: { onDone: () => void }) {
  const create = useServerFn(createUserAsAdmin);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("none");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return toast.error("E,mail e senha obrigatórios");
    setLoading(true);
    try {
      await create({
        data: {
          email,
          password,
          fullName: fullName || undefined,
          roles: role !== "none" ? [role] : [],
        },
      });
      toast.success("Usuário criado");
      setOpen(false);
      setEmail(""); setFullName(""); setPassword(""); setRole("none");
      onDone();
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="mr-2 h-4 w-4" /> Criar usuário</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar usuário manualmente</DialogTitle>
          <DialogDescription>A conta é criada já confirmada, sem envio de e,mail.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label>E,mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Senha temporária</Label><Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div>
            <Label>Papel inicial</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (usuário comum)</SelectItem>
                <SelectItem value="professional">professional</SelectItem>
                <SelectItem value="moderator">moderator</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteUserDialog({ onDone }: { onDone: () => void }) {
  const invite = useServerFn(inviteUserAsAdmin);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("none");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email) return toast.error("Informe o e,mail");
    setLoading(true);
    try {
      await invite({ data: { email, roles: role !== "none" ? [role] : [] } });
      toast.success("Convite enviado");
      setOpen(false); setEmail(""); setRole("none");
      onDone();
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Mail className="mr-2 h-4 w-4" /> Convidar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Convidar por e,mail</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>E,mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div>
            <Label>Papel ao aceitar</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="professional">professional</SelectItem>
                <SelectItem value="moderator">moderator</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>Enviar convite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GrantComplimentaryDialog({
  userId, userLabel, onDone,
}: { userId: string; userLabel: string; onDone: () => void }) {
  const grant = useServerFn(grantComplimentary);
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState("familia_plus_monthly");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await grant({
        data: {
          userId,
          plan,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          reason: reason || undefined,
        },
      });
      toast.success("Cortesia concedida");
      setOpen(false); setExpiresAt(""); setReason("");
      onDone();
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost"><Gift className="mr-1 h-3 w-3" /> Cortesia</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conceder assinatura de cortesia</DialogTitle>
          <DialogDescription>Para: <span className="font-medium">{userLabel}</span></DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Plano</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="familia_essencial_monthly">Família Essencial</SelectItem>
                <SelectItem value="familia_plus_monthly">Família Plus</SelectItem>
                <SelectItem value="clinica_monthly">Clínica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Expira em (opcional, vazio = vitalícia)</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div>
            <Label>Motivo (opcional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: parceria, beta tester" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}><Shield className="mr-2 h-4 w-4" /> Conceder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
