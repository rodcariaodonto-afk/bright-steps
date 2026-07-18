import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Plus } from "lucide-react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";
import { getProfessionalRepositories } from "@/modules/professional/repositories";
import { cn } from "@/lib/utils";

const agendaQuery = {
  queryKey: ["pro", "agenda", "today"],
  queryFn: async () => {
    const repos = getProfessionalRepositories();
    const [appointments, patients] = await Promise.all([
      repos.agenda.today(),
      repos.patients.list(),
    ]);
    return { appointments, patients };
  },
};

export const Route = createFileRoute("/pro/agenda")({
  loader: ({ context }) => context.queryClient.ensureQueryData(agendaQuery),
  component: AgendaPage,
});

const VIEWS = ["day", "week", "month", "list"] as const;

function AgendaPage() {
  const { t } = useTranslation("pro");
  const [view, setView] = useState<(typeof VIEWS)[number]>("day");
  const { data } = useSuspenseQuery(agendaQuery);
  const patientById = new Map(data.patients.map((p) => [p.id, p]));

  return (
    <ProPage
      title={t("agenda.title")}
      actions={
        <>
          <div className="flex rounded-md border border-border/60 bg-card p-0.5 text-xs">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded px-2.5 py-1 font-medium",
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`agenda.views.${v}`)}
              </button>
            ))}
          </div>
          <Button size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {t("agenda.new")}
          </Button>
        </>
      }
    >
      <ProCard>
        {data.appointments.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {t("agenda.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {data.appointments.map((apt) => {
              const child = patientById.get(apt.childId);
              const start = new Date(apt.start);
              const end = new Date(apt.end);
              return (
                <li key={apt.id} className="flex items-center gap-4 py-3">
                  <div className="w-20 shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {start.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {Math.round((end.getTime() - start.getTime()) / 60000)} min
                    </p>
                  </div>
                  <div className="h-10 w-1 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {child?.fullName ?? "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {child?.diagnosis} · {apt.modality === "online"
                        ? "Online"
                        : apt.location ?? "Presencial"}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {apt.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </ProCard>
    </ProPage>
  );
}
