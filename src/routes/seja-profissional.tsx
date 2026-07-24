import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Infinity as InfinityIcon,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/hooks/use-session";
import {
  getMyProfessionalApplicationStatus,
  submitProfessionalApplication,
} from "@/modules/marketplace/api.functions";

export const Route = createFileRoute("/seja-profissional")({
  head: () => ({
    meta: [
      { title: "Seja um Profissional · Meu Mundo Azul" },
      {
        name: "description",
        content:
          "Cadastre-se no marketplace do Meu Mundo Azul: psicólogos, terapeutas ocupacionais, fonoaudiólogos e demais especialistas em neurodesenvolvimento.",
      },
      { property: "og:title", content: "Seja um Profissional · Meu Mundo Azul" },
      {
        property: "og:description",
        content:
          "Faça parte do marketplace verificado de profissionais que apoiam famílias neurodivergentes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SejaProfissionalPage,
});

const COUNCIL_OPTIONS = [
  { value: "CRP", label: "CRP (Psicologia)" },
  { value: "CRM", label: "CRM (Medicina)" },
  { value: "CREFITO", label: "CREFITO (Fisio / TO)" },
  { value: "CRFa", label: "CRFa (Fonoaudiologia)" },
  { value: "CRN", label: "CRN (Nutrição)" },
  { value: "CRESS", label: "CRESS (Serviço Social)" },
  { value: "CREF", label: "CREF (Educação Física)" },
  { value: "OUTRO", label: "Outro" },
];

const SPECIALTY_OPTIONS = [
  "Psicologia Infantil",
  "Análise do Comportamento (ABA)",
  "Terapia Ocupacional",
  "Fonoaudiologia",
  "Psiquiatria Infantil",
  "Neuropediatria",
  "Fisioterapia",
  "Nutrição",
  "Psicopedagogia",
  "Musicoterapia",
  "Terapia Familiar",
];

function SejaProfissionalPage() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchStatus = useServerFn(getMyProfessionalApplicationStatus);
  const submit = useServerFn(submitProfessionalApplication);

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["pro-application", "me"],
    queryFn: () => fetchStatus(),
    enabled: Boolean(session),
  });

  const [form, setForm] = useState({
    full_name: "",
    council_type: "CRP",
    council_number: "",
    council_state: "SP",
    specialties: [] as string[],
    city: "",
    state: "SP",
    modality: "online" as "presencial" | "online" | "hibrido",
    price_range: "",
    contact_email: "",
    contact_phone: "",
    bio: "",
    terms_accepted: false,
  });

  useEffect(() => {
    if (session?.user.email && !form.contact_email) {
      setForm((f) => ({ ...f, contact_email: session.user.email ?? "" }));
    }
    if (status?.full_name && !form.full_name) {
      setForm((f) => ({
        ...f,
        full_name: status.full_name ?? "",
        council_type: status.council_type ?? f.council_type,
        council_number: status.council_number ?? f.council_number,
        council_state: status.council_state ?? f.council_state,
        specialties: status.specialties ?? f.specialties,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.terms_accepted) throw new Error("Você precisa aceitar os termos.");
      if (form.specialties.length === 0) throw new Error("Selecione ao menos uma especialidade.");
      await submit({
        data: {
          full_name: form.full_name,
          council_type: form.council_type,
          council_number: form.council_number,
          council_state: form.council_state,
          specialties: form.specialties,
          city: form.city || null,
          state: form.state || null,
          modality: form.modality,
          price_range: form.price_range || null,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone || null,
          bio: form.bio || null,
          languages: ["pt-BR"],
          terms_accepted: true,
        },
      });
    },
    onSuccess: () => {
      toast.success("Solicitação enviada! Nossa equipe irá analisar em breve.");
      qc.invalidateQueries({ queryKey: ["pro-application"] });
    },
    onError: (err: Error) => toast.error(err.message ?? "Não foi possível enviar."),
  });

  if (loading) return <div className="p-10 text-center text-muted-foreground">Carregando...</div>;

  // Sem sessão → landing pública + CTA para login
  if (!session) {
    return <PublicLanding onLogin={() => navigate({ to: "/auth" })} />;
  }

  // Já aprovado
  if (status?.moderation_status === "approved") {
    return (
      <StatusCard
        icon={<CheckCircle2 className="h-10 w-10 text-emerald-500" />}
        title="Cadastro aprovado"
        description="Seu perfil profissional está publicado no marketplace e você já tem acesso à Área Clínica."
        actionLabel="Ir para a Área Clínica"
        onAction={() => navigate({ to: "/pro" })}
      />
    );
  }

  if (status?.moderation_status === "pending") {
    return (
      <StatusCard
        icon={<Clock className="h-10 w-10 text-amber-500" />}
        title="Solicitação em análise"
        description="Recebemos seus dados. Nossa equipe está verificando seu registro no conselho. Isso costuma levar até 48 horas úteis."
        secondary={
          <p className="text-sm text-muted-foreground">
            Conselho informado: <strong>{status.council_type} {status.council_number}/{status.council_state}</strong>
          </p>
        }
      />
    );
  }

  const showRejected = status?.moderation_status === "rejected";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <InfinityIcon className="h-4 w-4" /> Voltar ao início
        </Link>

        <div className="mt-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Cadastro profissional</h1>
              <p className="text-sm text-muted-foreground">
                Preencha seus dados para entrar no marketplace verificado.
              </p>
            </div>
          </div>

          {showRejected && (
            <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive" />
                <div className="text-sm">
                  <p className="font-semibold text-destructive">Cadastro anterior recusado</p>
                  {status?.rejection_reason && (
                    <p className="mt-1 text-muted-foreground">{status.rejection_reason}</p>
                  )}
                  <p className="mt-1 text-muted-foreground">
                    Corrija as informações e envie novamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form
            className="mt-6 grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <Field label="Nome completo">
              <Input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                maxLength={120}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Conselho">
                <Select
                  value={form.council_type}
                  onValueChange={(v) => setForm({ ...form, council_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNCIL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Número">
                <Input
                  required
                  value={form.council_number}
                  onChange={(e) => setForm({ ...form, council_number: e.target.value })}
                  maxLength={30}
                />
              </Field>
              <Field label="UF">
                <Input
                  required
                  value={form.council_state}
                  onChange={(e) => setForm({ ...form, council_state: e.target.value.toUpperCase() })}
                  maxLength={4}
                />
              </Field>
            </div>

            <Field label="Especialidades (selecione ao menos uma)">
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_OPTIONS.map((s) => {
                  const active = form.specialties.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          specialties: active
                            ? form.specialties.filter((x) => x !== s)
                            : [...form.specialties, s],
                        })
                      }
                      className={
                        "rounded-full border px-3 py-1 text-xs transition " +
                        (active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted")
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Cidade">
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} />
              </Field>
              <Field label="Estado">
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} maxLength={4} />
              </Field>
              <Field label="Modalidade">
                <Select value={form.modality} onValueChange={(v: "presencial" | "online" | "hibrido") => setForm({ ...form, modality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail de contato">
                <Input
                  required
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  maxLength={120}
                />
              </Field>
              <Field label="Telefone / WhatsApp">
                <Input
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  maxLength={30}
                />
              </Field>
            </div>

            <Field label="Faixa de valores (opcional)">
              <Input
                placeholder="Ex.: R$ 200 a R$ 350 por sessão"
                value={form.price_range}
                onChange={(e) => setForm({ ...form, price_range: e.target.value })}
                maxLength={60}
              />
            </Field>

            <Field label="Bio profissional (opcional)">
              <Textarea
                rows={4}
                maxLength={2000}
                placeholder="Fale brevemente sobre sua formação, abordagem e experiência com neurodesenvolvimento."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </Field>

            <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
              <Checkbox
                checked={form.terms_accepted}
                onCheckedChange={(c) => setForm({ ...form, terms_accepted: Boolean(c) })}
              />
              <span className="text-muted-foreground">
                Declaro que as informações são verdadeiras, que meu registro profissional está ativo e concordo
                com os termos de uso e a política de privacidade (LGPD) do Meu Mundo Azul. Autorizo a exibição
                pública dos meus dados profissionais no marketplace após aprovação.
              </span>
            </label>

            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Após enviar, sua conta ficará aguardando análise. Você é notificado no e-mail cadastrado.
              </p>
              <Button type="submit" disabled={mutation.isPending || statusLoading}>
                {mutation.isPending ? "Enviando..." : "Enviar solicitação"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function StatusCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondary,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondary?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      {secondary && <div className="mt-4">{secondary}</div>}
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
      <div className="mt-6">
        <Link to="/app" className="text-sm text-muted-foreground underline underline-offset-4">
          Voltar para o app
        </Link>
      </div>
    </div>
  );
}

function PublicLanding({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <InfinityIcon className="h-4 w-4" /> Meu Mundo Azul · Marketplace
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Faça parte do marketplace de profissionais verificados.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Psicólogos, terapeutas ocupacionais, fonoaudiólogos, psiquiatras e demais especialistas em
          neurodesenvolvimento. Famílias encontram você por especialidade, cidade e modalidade.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Benefit icon={<ShieldCheck className="h-5 w-5" />} title="Verificação de conselho" description="Selo de verificação exibido no seu perfil público." />
          <Benefit icon={<BadgeCheck className="h-5 w-5" />} title="Área Clínica completa" description="Agenda, sessões, evolução e relatórios com IA." />
          <Benefit icon={<Sparkles className="h-5 w-5" />} title="IA clínica" description="Resumos, insights e apoio à devolutiva para as famílias." />
        </div>

        <div className="mt-10 rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Como funciona</h2>
          <ol className="mt-3 grid gap-3 text-sm text-muted-foreground">
            <li>1. Você cria uma conta e envia seus dados profissionais.</li>
            <li>2. Nossa equipe verifica o registro no conselho (até 48h úteis).</li>
            <li>3. Aprovado, você aparece no marketplace e recebe acesso à Área Clínica.</li>
          </ol>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={onLogin}>
              Entrar / Criar conta <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3 w-3" /> Dados protegidos pela LGPD
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function Benefit({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
