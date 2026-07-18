import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";
import { getProfessionalRepositories } from "@/modules/professional/repositories";

const goalsQuery = {
  queryKey: ["pro", "goals"],
  queryFn: async () => {
    const repos = getProfessionalRepositories();
    const [goals, patients] = await Promise.all([
      repos.goals.all(),
      repos.patients.list(),
    ]);
    return { goals, patients };
  },
};

export const Route = createFileRoute("/pro/objetivos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(goalsQuery),
  component: GoalsPage,
});

function GoalsPage() {
  const { t } = useTranslation("pro");
  const { data } = useSuspenseQuery(goalsQuery);
  const byId = new Map(data.patients.map((p) => [p.id, p]));

  return (
    <ProPage
      title={t("goals.title")}
      subtitle={t("goals.subtitle")}
      actions={<Button size="sm">Nova meta</Button>}
    >
      <ProCard>
        <div className="space-y-4">
          {data.goals.map((g) => (
            <article
              key={g.id}
              className="rounded-xl border border-border/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {byId.get(g.childId)?.fullName} · {g.category}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-foreground">
                    {g.description}
                  </h3>
                </div>
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  {g.status}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${g.progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {g.progressPercent}%
                </span>
              </div>
            </article>
          ))}
        </div>
      </ProCard>
    </ProPage>
  );
}
