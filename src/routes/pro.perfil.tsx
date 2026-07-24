import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  getMyProfessionalProfile,
  upsertMyProfessionalProfile,
  listIncomingContactRequests,
  updateContactRequestStatus,
} from "@/modules/marketplace/api.functions";

export const Route = createFileRoute("/pro/perfil")({
  component: ProProfilePage,
});

type FormState = {
  full_name: string;
  bio: string;
  photo_url: string;
  council_type: string;
  council_number: string;
  council_state: string;
  specialties: string;
  city: string;
  state: string;
  modality: string;
  price_range: string;
  contact_email: string;
  contact_phone: string;
  languages: string;
  accepting_patients: boolean;
  visible_in_marketplace: boolean;
};

const EMPTY: FormState = {
  full_name: "",
  bio: "",
  photo_url: "",
  council_type: "",
  council_number: "",
  council_state: "",
  specialties: "",
  city: "",
  state: "",
  modality: "",
  price_range: "",
  contact_email: "",
  contact_phone: "",
  languages: "pt-BR",
  accepting_patients: false,
  visible_in_marketplace: false,
};

function ProProfilePage() {
  const qc = useQueryClient();
  const load = useServerFn(getMyProfessionalProfile);
  const save = useServerFn(upsertMyProfessionalProfile);
  const incoming = useServerFn(listIncomingContactRequests);
  const setStatus = useServerFn(updateContactRequestStatus);

  const { data: profile } = useQuery({
    queryKey: ["pro", "my-profile"],
    queryFn: () => load(),
  });
  const { data: requests = [] } = useQuery({
    queryKey: ["pro", "contact-requests"],
    queryFn: () => incoming(),
  });

  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        bio: profile.bio ?? "",
        photo_url: profile.photo_url ?? "",
        council_type: profile.council_type ?? "",
        council_number: profile.council_number ?? "",
        council_state: profile.council_state ?? "",
        specialties: (profile.specialties ?? []).join(", "),
        city: profile.city ?? "",
        state: profile.state ?? "",
        modality: profile.modality ?? "",
        price_range: profile.price_range ?? "",
        contact_email: profile.contact_email ?? "",
        contact_phone: profile.contact_phone ?? "",
        languages: (profile.languages ?? ["pt-BR"]).join(", "),
        accepting_patients: profile.accepting_patients ?? false,
        visible_in_marketplace: profile.visible_in_marketplace ?? false,
      });
    }
  }, [profile]);

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          full_name: form.full_name,
          bio: form.bio || null,
          photo_url: form.photo_url || null,
          council_type: form.council_type || null,
          council_number: form.council_number || null,
          council_state: form.council_state || null,
          specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
          city: form.city || null,
          state: form.state || null,
          modality: form.modality || null,
          price_range: form.price_range || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
          accepting_patients: form.accepting_patients,
          visible_in_marketplace: form.visible_in_marketplace,
        },
      }),
    onSuccess: () => {
      toast.success("Perfil salvo");
      qc.invalidateQueries({ queryKey: ["pro", "my-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "accepted" | "declined" }) => setStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pro", "contact-requests"] }),
  });

  return (
    <ProPage title="Meu perfil público">
      <div className="grid gap-4 lg:grid-cols-3">
        <ProCard title="Publicação no Marketplace" className="lg:col-span-3">
          <div className="space-y-3">
            {profile && (
              <ModerationBanner
                status={(profile as { moderation_status?: string }).moderation_status ?? "pending"}
                reason={(profile as { rejection_reason?: string | null }).rejection_reason ?? null}
                slug={(profile as { slug?: string | null }).slug ?? null}
              />
            )}
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.visible_in_marketplace}
                  onCheckedChange={(v) => setForm({ ...form, visible_in_marketplace: v })}
                />
                Visível no Marketplace
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.accepting_patients}
                  onCheckedChange={(v) => setForm({ ...form, accepting_patients: v })}
                />
                Aceitando novos pacientes
              </label>
            </div>
          </div>
        </ProCard>

        <ProCard title="Dados profissionais" className="lg:col-span-2">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome completo">
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </Field>
            <Field label="Tipo de conselho">
              <Input value={form.council_type} onChange={(e) => setForm({ ...form, council_type: e.target.value })} placeholder="CRP, CRM, CREFITO..." />
            </Field>
            <Field label="Número do conselho">
              <Input value={form.council_number} onChange={(e) => setForm({ ...form, council_number: e.target.value })} placeholder="00/000000" />
            </Field>
            <Field label="UF do conselho">
              <Input value={form.council_state} onChange={(e) => setForm({ ...form, council_state: e.target.value })} placeholder="SP" maxLength={2} />
            </Field>
            <Field label="Especialidades (vírgula)" full>
              <Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="TEA, TDAH, ABA" />
            </Field>
            <Field label="Cidade">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="Estado">
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </Field>
            <Field label="Modalidade">
              <Input value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })} placeholder="Online, Presencial, Híbrido" />
            </Field>
            <Field label="Faixa de preço">
              <Input value={form.price_range} onChange={(e) => setForm({ ...form, price_range: e.target.value })} placeholder="R$ 200 a R$ 350" />
            </Field>
            <Field label="Idiomas (vírgula)" full>
              <Input value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
            </Field>
            <Field label="Bio" full>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} />
            </Field>
            <Field label="Foto (URL)" full>
              <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
            </Field>
          </div>
        </ProCard>

        <ProCard title="Contato">
          <div className="space-y-3">
            <Field label="E-mail de contato">
              <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </Field>
            <Field label="Telefone / WhatsApp">
              <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            </Field>
            <Button className="w-full" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? "Salvando..." : "Salvar perfil"}
            </Button>
          </div>
        </ProCard>

        <ProCard title="Solicitações de contato" className="lg:col-span-3">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação ainda.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {r.requester?.full_name ?? r.requester?.email ?? "Família"}
                      </span>
                      <Badge variant={r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary"}>
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.message}</p>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => statusMut.mutate({ id: r.id, status: "declined" })}>
                        Recusar
                      </Button>
                      <Button size="sm" onClick={() => statusMut.mutate({ id: r.id, status: "accepted" })}>
                        Aceitar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ProCard>
      </div>
    </ProPage>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
