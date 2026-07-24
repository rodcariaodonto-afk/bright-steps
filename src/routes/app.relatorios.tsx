import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, FileText, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useActiveChild } from "@/hooks/use-active-child";
import { NoChildSelected } from "@/components/atlas/no-child-selected";
import {
  useMoodLogs,
  useMedicationLogs,
  useMedications,
  useBehaviorEvents,
  useRoutines,
  useCompletionsToday,
} from "@/hooks/use-care";
import { useGoals, useReports, useCreateReport, useDeleteReport } from "@/hooks/use-goals";

export const Route = createFileRoute("/app/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios · Meu Mundo Azul" },
      {
        name: "description",
        content: "Resumos semanais gerados pela Azul IA a partir dos dados registrados.",
      },
    ],
  }),
  component: ReportsPage,
});

const MS_WEEK = 7 * 24 * 60 * 60 * 1000;

function ReportsPage() {
  const { activeChild } = useActiveChild();
  const { data: reports = [], isLoading } = useReports(activeChild?.id);
  const create = useCreateReport(activeChild?.id);
  const del = useDeleteReport(activeChild?.id);

  const { data: moods = [] } = useMoodLogs(activeChild?.id);
  const { data: medLogs = [] } = useMedicationLogs(activeChild?.id);
  const { data: meds = [] } = useMedications(activeChild?.id);
  const { data: behaviors = [] } = useBehaviorEvents(activeChild?.id);
  const { data: routines = [] } = useRoutines(activeChild?.id);
  const { data: completionsToday = [] } = useCompletionsToday(activeChild?.id);
  const { data: goals = [] } = useGoals(activeChild?.id);

  const [generating, setGenerating] = useState(false);

  const weekRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - MS_WEEK);
    return { start, end };
  }, []);

  if (!activeChild) return <NoChildSelected />;

  function aggregateStats() {
    const { start, end } = weekRange;
    const inRange = (iso: string) => {
      const d = new Date(iso);
      return d >= start && d <= end;
    };

    const moodBuckets: Record<number, number> = {};
    for (const m of moods) {
      if (!inRange(m.logged_at)) continue;
      moodBuckets[m.level] = (moodBuckets[m.level] ?? 0) + 1;
    }

    const medBuckets: Record<string, number> = {};
    for (const l of medLogs) {
      if (!inRange(l.taken_at)) continue;
      const name = meds.find((m) => m.id === l.medication_id)?.name ?? "?";
      medBuckets[name] = (medBuckets[name] ?? 0) + 1;
    }

    const behaviorBuckets: Record<string, number> = {};
    for (const b of behaviors) {
      if (!inRange(b.occurred_at)) continue;
      behaviorBuckets[b.category] = (behaviorBuckets[b.category] ?? 0) + 1;
    }

    return {
      moods: Object.entries(moodBuckets).map(([level, count]) => ({
        level: Number(level),
        count,
      })),
      medications: Object.entries(medBuckets).map(([name, doses]) => ({
        name,
        doses,
      })),
      behaviors: Object.entries(behaviorBuckets).map(([category, count]) => ({
        category,
        count,
      })),
      routinesCompleted: completionsToday.length,
      routinesTotal: routines.length,
      goals: goals.slice(0, 8).map((g) => ({
        title: g.title,
        status: g.status,
        progressCount: 0,
      })),
    };
  }

  async function generateWeekly() {
    setGenerating(true);
    try {
      const stats = aggregateStats();
      const periodLabel = `${weekRange.start.toLocaleDateString("pt-BR")} a ${weekRange.end.toLocaleDateString("pt-BR")}`;
      const firstName =
        activeChild!.nickname ?? activeChild!.full_name.split(" ")[0];

      const res = await fetch("/api/reports/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childFirstName: firstName,
          periodLabel,
          stats,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { summary } = (await res.json()) as { summary: string };

      await create.mutateAsync({
        child_id: activeChild!.id,
        kind: "weekly",
        period_start: weekRange.start.toISOString().slice(0, 10),
        period_end: weekRange.end.toISOString().slice(0, 10),
        title: `Semana de ${weekRange.end.toLocaleDateString("pt-BR")}`,
        summary,
        highlights: [],
        data: stats,
        ai_generated: true,
      });

      toast.success("Relatório gerado");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
            Relatórios
          </h1>
          <p className="text-sm text-muted-foreground">
            A Azul IA sintetiza os dados da semana em texto claro.
          </p>
        </div>
        <Button className="rounded-full" onClick={generateWeekly} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> Gerar semanal com Azul IA
            </>
          )}
        </Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : reports.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum relatório ainda. Clique em "Gerar semanal" para começar.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.period_start).toLocaleDateString("pt-BR")} a{" "}
                      {new Date(r.period_end).toLocaleDateString("pt-BR")}
                      {r.ai_generated && " · gerado por Azul IA"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    del.mutate(r.id, { onSuccess: () => toast.success("Removido") })
                  }
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {r.summary}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
