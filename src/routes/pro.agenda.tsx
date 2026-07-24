import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Plus, Clock, MapPin, Video } from "lucide-react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";
import { getProfessionalRepositories } from "@/modules/professional/repositories";
import { proWrites } from "@/modules/professional/repositories/supabase";
import { toast } from "sonner";

const agendaQuery = {
  queryKey: ["pro", "agenda", "week"],
  queryFn: async () => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 14);
    const repos = getProfessionalRepositories();
    const [appointments, patients] = await Promise.all([
      repos.agenda.listForRange(from.toISOString(), to.toISOString()),
      repos.patients.list(),
    ]);
    return { appointments, patients };
  },
};

export const Route = createFileRoute("/pro/agenda")({
  loader: ({ context }) => context.queryClient.ensureQueryData(agendaQuery),
  component: AgendaPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Erro: {error.message}</div>
  ),
});

function AgendaPage() {
  const { t } = useTranslation("pro");
  const { data } = useSuspenseQuery(agendaQuery);
  const qc = useQueryClient();
  const patientById = new Map(data.patients.map((p) => [p.id, p]));

  const [open, setOpen] = useState(false);
  const now = new Date();
  const [childId, setChildId] = useState(data.patients[0]?.id ?? "");
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(50);
  const [modality, setModality] = useState<"in_person" | "online" | "home_visit" | "school_visit">("in_person");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!childId) return toast.error("Selecione um paciente");
    setSaving(true);
    try {
      const start = new Date(`${date}T${time}:00`);
      const end = new Date(start.getTime() + duration * 60_000);
      await proWrites.createAppointment({
        childId,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        modality,
        location: location || undefined,
      });
      toast.success("Agendamento criado");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["pro"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  const grouped = new Map<string, typeof data.appointments>();
  for (const a of data.appointments) {
    const key = new Date(a.start).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    });
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  }

  return (
    <ProPage
      title={t("agenda.title")}
      actions={
        <Button size="sm" onClick={() => setOpen((o) => !o)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Novo agendamento
        </Button>
      }
    >
      {open && (
        <ProCard title="Novo agendamento">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Paciente</span>
              <select value={childId} onChange={(e) => setChildId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm">
                {data.patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Data</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Hora</span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Duração (min)</span>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Modalidade</span>
              <select value={modality} onChange={(e) => setModality(e.target.value as typeof modality)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm">
                <option value="in_person">Presencial</option>
                <option value="online">Online</option>
                <option value="home_visit">Visita domiciliar</option>
                <option value="school_visit">Visita escolar</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Local / link</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Sala 3 ou URL"
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={submit} disabled={saving}>{saving ? "Salvando…" : "Criar"}</Button>
          </div>
        </ProCard>
      )}

      {data.appointments.length === 0 ? (
        <ProCard>
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Nenhum agendamento nos próximos 14 dias.
          </p>
        </ProCard>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([day, list]) => (
            <ProCard key={day} title={day}>
              <ul className="divide-y divide-border/60">
                {list.map((a) => {
                  const child = patientById.get(a.childId);
                  return (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{child?.fullName ?? "Paciente"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            {" – "}
                            {new Date(a.end).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            {" · "}{a.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {a.modality === "online" ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                        {a.location ?? (a.modality === "online" ? "Online" : "Presencial")}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ProCard>
          ))}
        </div>
      )}
    </ProPage>
  );
}
