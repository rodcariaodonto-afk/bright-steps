import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Loader2,
  Mail,
  Trash2,
  UserCheck,
  Clock,
  Shield,
  Stethoscope,
} from "lucide-react";

import { useChildren } from "@/hooks/use-family";
import { proWrites } from "@/modules/professional/repositories/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/hooks/use-session";
import {
  useFamily,
  useFamilyMembers,
  useUpdateFamily,
  useInviteMember,
  useRemoveMember,
} from "@/hooks/use-family";
import type { FamilyRole } from "@/modules/family/api";

const ROLE_LABEL: Record<FamilyRole, string> = {
  owner: "Dono",
  guardian: "Guardião",
  parent: "Responsável",
  caregiver: "Cuidador",
};

const TZ_OPTIONS = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Recife",
  "America/Fortaleza",
  "America/Belem",
  "America/Rio_Branco",
];

export const Route = createFileRoute("/app/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações · Meu Mundo Azul" },
      {
        name: "description",
        content:
          "Ajuste os dados da sua família, o fuso horário e convide responsáveis e cuidadores.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile } = useSession();
  const { data: family, isLoading } = useFamily();

  if (isLoading || !family) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Configurações
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">
          Sua família
        </h1>
        <p className="mt-1 text-muted-foreground">
          Ajuste os dados básicos e convide quem mais cuida junto.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <FamilyBasicsCard familyId={family.id} initialName={family.name} initialTz={family.timezone} />
          <MembersCard familyId={family.id} />
          <ProfessionalsCard familyId={family.id} />
        </section>
        <aside className="space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Sua conta
            </p>
            <p className="mt-3 font-display text-lg font-bold text-foreground">
              {profile?.fullName ?? "Você"}
            </p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Para sair, use o menu do avatar no canto superior. Para excluir a conta,
              entre em contato com o suporte.
            </p>
          </div>
          <div className="rounded-3xl border border-primary/20 bg-primary-soft/50 p-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
              <p className="font-display text-sm font-bold text-foreground">
                Seus dados sob LGPD
              </p>
            </div>
            <p className="mt-3 text-xs text-foreground/80">
              Cada convite gera acesso limitado por criança. Membros só veem o que
              você autorizar. Consentimentos ficam registrados e podem ser
              revogados a qualquer momento.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FamilyBasicsCard({
  familyId,
  initialName,
  initialTz,
}: {
  familyId: string;
  initialName: string;
  initialTz: string;
}) {
  const [name, setName] = useState(initialName);
  const [tz, setTz] = useState(initialTz);
  const updateMut = useUpdateFamily();

  async function save() {
    try {
      await updateMut.mutateAsync({ id: familyId, patch: { name: name.trim(), timezone: tz } });
      toast.success("Dados da família atualizados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <h2 className="font-display text-lg font-bold text-foreground">Dados da família</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Esses dados aparecem para todos os membros e definem os fusos das rotinas.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="family-name">Nome da família</Label>
          <Input
            id="family-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Fuso horário</Label>
          <Select value={tz} onValueChange={setTz}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TZ_OPTIONS.map((z) => (
                <SelectItem key={z} value={z}>
                  {z.replace("America/", "").replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={updateMut.isPending}>
          {updateMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}

function MembersCard({ familyId }: { familyId: string }) {
  const { data: members = [], isLoading } = useFamilyMembers(familyId);
  const inviteMut = useInviteMember(familyId);
  const removeMut = useRemoveMember(familyId);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<FamilyRole>("guardian");

  async function invite() {
    if (!email.trim()) {
      toast.error("Informe um e-mail");
      return;
    }
    try {
      await inviteMut.mutateAsync({ email, role });
      toast.success("Convite registrado", {
        description: "O envio automático de e-mail entra na próxima onda.",
      });
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao convidar");
    }
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Users className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Quem cuida junto
          </h2>
          <p className="text-sm text-muted-foreground">
            Convide responsáveis, avós e cuidadores.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1 space-y-1.5">
          <Label htmlFor="invite-email">E-mail</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pessoa@exemplo.com"
          />
        </div>
        <div className="w-40 space-y-1.5">
          <Label>Papel</Label>
          <Select value={role} onValueChange={(v) => setRole(v as FamilyRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="guardian">Guardião</SelectItem>
              <SelectItem value="parent">Responsável</SelectItem>
              <SelectItem value="caregiver">Cuidador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={invite} disabled={inviteMut.isPending}>
          {inviteMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          Convidar
        </Button>
      </div>

      <Separator className="my-6" />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Nenhum membro além de você ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-2xl border border-border/50 bg-background p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {m.invited_email ?? m.user_id?.slice(0, 8) ?? "Membro"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {ROLE_LABEL[m.role]}
                  </Badge>
                  {m.status === "active" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                      <UserCheck className="h-3 w-3" /> ativo
                    </span>
                  ) : m.status === "invited" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                      <Clock className="h-3 w-3" /> convite pendente
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">revogado</span>
                  )}
                </div>
              </div>
              {m.role !== "owner" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover"
                  onClick={async () => {
                    try {
                      await removeMut.mutateAsync(m.id);
                      toast.success("Membro removido");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Falha");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfessionalsCard({ familyId }: { familyId: string }) {
  const { data: children = [] } = useChildren(familyId);
  const [childId, setChildId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "write" | "admin">("write");
  const [busy, setBusy] = useState(false);

  async function invite() {
    if (!childId || !email.trim()) {
      toast.error("Selecione a criança e informe o e-mail");
      return;
    }
    setBusy(true);
    try {
      await proWrites.addProfessionalByEmail(childId, email.trim(), permission);
      toast.success("Profissional vinculado");
      setEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao vincular";
      toast.error(msg.includes("not found") ? "Profissional ainda não tem conta na plataforma" : msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent-foreground">
          <Stethoscope className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Profissionais vinculados
          </h2>
          <p className="text-sm text-muted-foreground">
            Dê acesso a psicólogos, terapeutas ou médicos que acompanham a criança.
          </p>
        </div>
      </div>

      {children.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Cadastre uma criança antes de convidar profissionais.
        </p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Criança</Label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                {children.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="pro-email">E-mail do profissional</Label>
            <Input
              id="pro-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="profissional@exemplo.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Permissão</Label>
            <Select value={permission} onValueChange={(v) => setPermission(v as typeof permission)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="view">Somente leitura</SelectItem>
                <SelectItem value="write">Registrar sessões</SelectItem>
                <SelectItem value="admin">Administrar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={invite} disabled={busy} className="w-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Vincular
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
