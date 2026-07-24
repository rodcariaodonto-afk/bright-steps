import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  Users,
  FileText,
  MessagesSquare,
  FolderOpen,
  Target,
  Sparkles,
  Plus,
  Clock,
  MapPin,
  Video,
} from "lucide-react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";
import { getProfessionalRepositories } from "@/modules/professional/repositories";

const dashboardQuery = {
  queryKey: ["pro", "dashboard"],
  queryFn: async () => {
    const repos = getProfessionalRepositories();
    const [snapshot, patients, me, goals] = await Promise.all([
      repos.dashboard.snapshot(),
      repos.patients.list(),
      repos.me.getMe(),
      repos.goals.all(),
    ]);
    return { snapshot, patients, me, goals };
  },
};

export const Route = createFileRoute("/pro/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  component: ProDashboard,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Erro ao carregar painel: {error.message}</div>
  ),
});

function greet(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProDashboard() {
  const { t } = useTranslation("pro");
  const { data } = useSuspenseQuery(dashboardQuery);
  const patientById = new Map(data.patients.map((p) => [p.id, p]));

  const firstName = data.me?.fullName.split(" ")[0] ?? "";
  const now = new Date();

  return (
    <ProPage
      title={`${greet(now.getHours())}, ${firstName}`}
      subtitle={t("dashboard.subtitle", {
        count: data.snapshot.todayAppointments.length,
      })}
      actions={
        <>
          <Button asChild size="sm">
            <Link to="/pro/sessoes/nova">
              <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t("dashboard.quickActions.newSession")}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/pro/relatorios">
              {t("dashboard.quickActions.newReport")}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/pro/ia">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t("dashboard.quickActions.askAI")}
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label={t("dashboard.cards.activePatients")}
          value={data.snapshot.activePatients}
        />
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label={t("dashboard.cards.pendingReports")}
          value={data.snapshot.pendingReports}
        />
        <StatCard
          icon={<MessagesSquare className="h-4 w-4" />}
          label={t("dashboard.cards.messages")}
          value={data.snapshot.unreadMessages}
        />
        <StatCard
          icon={<FolderOpen className="h-4 w-4" />}
          label={t("dashboard.cards.newDocuments")}
          value={data.snapshot.newDocuments}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProCard title={t("dashboard.cards.todayAgenda")}>
            {data.snapshot.todayAppointments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                Nenhum atendimento agendado para hoje.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {data.snapshot.todayAppointments.map((apt) => {
                  const child = patientById.get(apt.childId);
                  return (
                    <li
                      key={apt.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {child?.fullName ?? "Paciente"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(apt.start)}–{formatTime(apt.end)} ·{" "}
                            {child?.diagnosis ?? ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {apt.modality === "online" ? (
                          <Video className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {apt.location ??
                          (apt.modality === "online" ? "Online" : "Presencial")}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ProCard>
        </div>

        <ProCard
          title={t("dashboard.cards.sharedGoals")}
          description={t("dashboard.cards.weekSummary")}
        >
          <ul className="space-y-3">
            {data.goals.map((g) => {
              const child = patientById.get(g.childId);
              return (
                <li key={g.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-foreground">
                      {child?.fullName}
                    </span>
                    <span className="text-muted-foreground">
                      {g.progressPercent}%
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {g.description}
                  </p>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${g.progressPercent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </ProCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProCard
          title={t("dashboard.cards.aiAlerts")}
          description={t("dashboard.cards.monthSummary")}
        >
          <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent-soft/50 p-3">
            <Sparkles
              className="mt-0.5 h-4 w-4 text-accent-foreground"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-accent-foreground">
              Padrão detectado: <strong>Bento</strong> reduziu episódios de
              desregulação em <strong>34%</strong> nas últimas 4 semanas.
              Sugestão: consolidar a rotina atual e discutir na próxima
              devolutiva com a família.
            </p>
          </div>
        </ProCard>

        <ProCard title={t("dashboard.cards.pending")}>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <span>Relatório mensal de Miguel</span>
              <Link to="/pro/relatorios" className="text-primary hover:underline">
                abrir
              </Link>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <span>Nova escala aplicada, aguarda revisão</span>
              <Link to="/pro/escalas" className="text-primary hover:underline">
                abrir
              </Link>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <span>Documento recebido da família de Aurora</span>
              <Link to="/pro/documentos" className="text-primary hover:underline">
                abrir
              </Link>
            </li>
          </ul>
        </ProCard>
      </div>
    </ProPage>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-soft text-primary">
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
