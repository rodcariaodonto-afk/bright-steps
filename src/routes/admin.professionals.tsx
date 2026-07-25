import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { listAdminProfessionals } from "@/modules/admin/api.functions";
import { moderateProfessional } from "@/modules/marketplace/api.functions";
import { createProfessionalAsAdmin } from "@/modules/admin/people.functions";

export const Route = createFileRoute("/admin/professionals")({
  component: AdminProfessionals,
});

function statusVariant(s: string) {
  if (s === "approved") return "default";
  if (s === "rejected") return "destructive";
  return "secondary";
}

function AdminProfessionals() {
  const { t } = useTranslation("admin");
  const qc = useQueryClient();
  const fetchPros = useServerFn(listAdminProfessionals);
  const moderate = useServerFn(moderateProfessional);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "professionals"],
    queryFn: () => fetchPros(),
  });

  const moderateMut = useMutation({
    mutationFn: (v: { user_id: string; status: "approved" | "rejected"; reason?: string }) =>
      moderate({ data: v }),
    onSuccess: () => {
      toast.success("Moderação atualizada");
      qc.invalidateQueries({ queryKey: ["admin", "professionals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminPage title={t("sidebar.professionals")} description="Moderação e verificação de profissionais.">
      <div className="mb-4 flex justify-end">
        <CreateProfessionalDialog onCreated={() => qc.invalidateQueries({ queryKey: ["admin", "professionals"] })} />
      </div>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">

        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Conselho</th>
              <th className="px-4 py-2">Especialidades</th>
              <th className="px-4 py-2">Pacientes</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {data?.map((p) => {
              const council = [p.council_type, p.council_number, p.council_state].filter(Boolean).join(" ") || "—";
              return (
                <tr key={p.id} className="border-t border-border/50">
                  <td className="px-4 py-2">
                    <div className="font-medium text-foreground">{p.full_name}</div>
                    <div className="text-xs text-muted-foreground">{p.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{council}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(p.specialties ?? []).map((s: string) => (
                        <Badge key={s} variant="secondary">{s}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{p.patients}</td>
                  <td className="px-4 py-2">
                    <Badge variant={statusVariant(p.moderation_status)}>{p.moderation_status}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      {p.moderation_status !== "approved" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            moderateMut.mutate({ user_id: p.user_id, status: "approved" })
                          }
                          disabled={moderateMut.isPending}
                        >
                          Aprovar
                        </Button>
                      )}
                      {p.moderation_status !== "rejected" && (
                        <RejectDialog
                          onConfirm={(reason) =>
                            moderateMut.mutate({ user_id: p.user_id, status: "rejected", reason })
                          }
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Nenhum profissional.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}

function RejectDialog({ onConfirm }: { onConfirm: (reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Recusar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recusar perfil</DialogTitle>
        </DialogHeader>
        <Textarea
          rows={4}
          placeholder="Motivo (visível para o profissional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={() => {
              onConfirm(reason);
              setOpen(false);
              setReason("");
            }}
          >
            Confirmar recusa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateProfessionalDialog({ onCreated }: { onCreated: () => void }) {
  const createFn = useServerFn(createProfessionalAsAdmin);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    council_type: "",
    council_number: "",
    council_state: "",
    specialties: "",
    bio: "",
    city: "",
    state: "",
  });

  const mut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          email: form.email,
          full_name: form.full_name,
          council_type: form.council_type || undefined,
          council_number: form.council_number || undefined,
          council_state: form.council_state || undefined,
          specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
          bio: form.bio || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Profissional cadastrado e aprovado");
      onCreated();
      setOpen(false);
      setForm({ email: "", full_name: "", council_type: "", council_number: "", council_state: "", specialties: "", bio: "", city: "", state: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" />Cadastrar profissional</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Novo profissional</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nome completo" value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Input placeholder="E‑mail (cria usuário se não existir)" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Conselho (CRP, CRM…)" value={form.council_type}
              onChange={(e) => setForm({ ...form, council_type: e.target.value })} />
            <Input placeholder="Número" value={form.council_number}
              onChange={(e) => setForm({ ...form, council_number: e.target.value })} />
            <Input placeholder="UF" value={form.council_state}
              onChange={(e) => setForm({ ...form, council_state: e.target.value })} />
          </div>
          <Input placeholder="Especialidades (separadas por vírgula)" value={form.specialties}
            onChange={(e) => setForm({ ...form, specialties: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Cidade" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input placeholder="UF" value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <Textarea rows={3} placeholder="Bio" value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={!form.email || !form.full_name || mut.isPending}>
            {mut.isPending ? "Salvando…" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
