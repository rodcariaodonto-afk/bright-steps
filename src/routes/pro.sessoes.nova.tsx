import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Sparkles } from "lucide-react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";
import { getProfessionalRepositories } from "@/modules/professional/repositories";
import { proWrites } from "@/modules/professional/repositories/supabase";
import { toast } from "sonner";

const patientsQuery = {
  queryKey: ["pro", "patients"],
  queryFn: () => getProfessionalRepositories().patients.list(),
};

export const Route = createFileRoute("/pro/sessoes/nova")({
  loader: ({ context }) => context.queryClient.ensureQueryData(patientsQuery),
  component: NewSessionPage,
});

function NewSessionPage() {
  const { t } = useTranslation("pro");
  const { data: patients } = useSuspenseQuery(patientsQuery);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [childId, setChildId] = useState<string>(patients[0]?.id ?? "");
  const now = new Date();
  const [date, setDate] = useState<string>(now.toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(now.toTimeString().slice(0, 5));
  const [duration, setDuration] = useState<number>(50);
  const [activities, setActivities] = useState("");
  const [materials, setMaterials] = useState("");
  const [childResponse, setChildResponse] = useState("");
  const [observations, setObservations] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [share, setShare] = useState(true);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!childId) {
      toast.error("Selecione um paciente");
      return;
    }
    if (!activities.trim()) {
      toast.error("Descreva as atividades");
      return;
    }
    setSaving(true);
    try {
      await proWrites.createSession({
        childId,
        sessionDate: new Date(`${date}T${time}:00`).toISOString(),
        durationMinutes: duration,
        activities,
        materials: materials || undefined,
        childResponse: childResponse || undefined,
        observations: observations || undefined,
        nextSteps: nextSteps || undefined,
        sharedWithFamily: share,
      });
      toast.success("Sessão registrada");
      qc.invalidateQueries({ queryKey: ["pro"] });
      navigate({ to: "/pro/pacientes/$childId", params: { childId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProPage
      title={t("sessions.titleNew")}
      actions={
        <Button size="sm" onClick={submit} disabled={saving}>
          {saving ? "Salvando…" : "Registrar sessão"}
        </Button>
      }
    >
      {patients.length === 0 ? (
        <ProCard>
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Você ainda não tem pacientes vinculados. Solicite acesso a uma
            família em Configurações da família.
          </div>
        </ProCard>
      ) : (
        <>
          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary-soft/50 p-3 text-xs text-primary">
            <Sparkles className="mt-0.5 h-3.5 w-3.5" aria-hidden="true" />
            {t("sessions.reuse")}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ProCard title="Dados da sessão" className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("sessions.fields.child")}>
                  <select
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("sessions.fields.date")}>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </Field>
                <Field label={t("sessions.fields.time")}>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </Field>
                <Field label={t("sessions.fields.duration")}>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                </Field>
              </div>
              <Area
                className="mt-4"
                label={t("sessions.fields.activities")}
                value={activities}
                onChange={setActivities}
                placeholder="Descreva as atividades realizadas…"
              />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Area
                  label={t("sessions.fields.materials")}
                  value={materials}
                  onChange={setMaterials}
                  placeholder="Materiais utilizados"
                />
                <Area
                  label={t("sessions.fields.response")}
                  value={childResponse}
                  onChange={setChildResponse}
                  placeholder="Como a criança respondeu"
                />
              </div>
              <Area
                className="mt-4"
                label={t("sessions.fields.observations")}
                value={observations}
                onChange={setObservations}
                placeholder="Observações clínicas"
              />
              <Area
                className="mt-4"
                label="Próximos passos"
                value={nextSteps}
                onChange={setNextSteps}
                placeholder="Orientações para casa e próxima sessão"
              />
            </ProCard>

            <ProCard title="Compartilhamento">
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={share}
                  onChange={(e) => setShare(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Compartilhar esta sessão com a família
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Se desmarcado, o registro fica visível apenas para você.
                  </span>
                </span>
              </label>
            </ProCard>
          </div>
        </>
      )}
    </ProPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
      />
    </label>
  );
}
