import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { getProfessionalRepositories } from "@/modules/professional/repositories";
import { cn } from "@/lib/utils";

function childQuery(childId: string) {
  return {
    queryKey: ["pro", "patient", childId],
    queryFn: async () => {
      const repos = getProfessionalRepositories();
      const [patient, goals] = await Promise.all([
        repos.patients.get(childId),
        repos.goals.listByChild(childId),
      ]);
      if (!patient) throw notFound();
      return { patient, goals };
    },
  };
}

export const Route = createFileRoute("/pro/pacientes/$childId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(childQuery(params.childId)),
  component: PatientDetail,
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">Paciente não encontrado.</div>
  ),
});

const TAB_KEYS = [
  "overview",
  "sessions",
  "evolution",
  "goals",
  "scales",
  "reports",
  "documents",
  "school",
  "family",
] as const;

type TabKey = (typeof TAB_KEYS)[number];

function PatientDetail() {
  const { childId } = Route.useParams();
  const { t } = useTranslation("pro");
  const { data } = useSuspenseQuery(childQuery(childId));
  const [tab, setTab] = useState<TabKey>("overview");

  const p = data.patient;

  return (
    <ProPage
      title={p.fullName}
      subtitle={`${p.diagnosis ?? ""} · CID ${p.cid ?? "—"} · Suporte nível ${p.supportLevel ?? "—"}`}
      actions={
        <Link
          to="/pro/pacientes"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← voltar
        </Link>
      }
    >
      <nav className="flex gap-1 overflow-x-auto rounded-lg border border-border/60 bg-card p-1">
        {TAB_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === k
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t(`patients.tabs.${k}`)}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <ProCard title="Dados básicos" className="lg:col-span-2">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Nascimento">
                {new Date(p.birthDate).toLocaleDateString("pt-BR")}
              </Field>
              <Field label="Diagnóstico">{p.diagnosis ?? "—"}</Field>
              <Field label="CID">{p.cid ?? "—"}</Field>
              <Field label="Nível de suporte">{p.supportLevel ?? "—"}</Field>
              <Field label="Interesses">
                {p.interests?.join(", ") ?? "—"}
              </Field>
              <Field label="Permissões">{p.scopes.join(", ")}</Field>
            </dl>
          </ProCard>
          <ProCard title="Objetivos ativos">
            {data.goals.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum objetivo compartilhado ainda.
              </p>
            )}
            <ul className="space-y-3">
              {data.goals.map((g) => (
                <li key={g.id}>
                  <p className="text-xs font-medium text-foreground">
                    {g.description}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {g.category}
                  </p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${g.progressPercent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </ProCard>
        </div>
      )}

      {tab !== "overview" && (
        <ProCard
          title={t(`patients.tabs.${tab}`)}
          description="Estrutura pronta — os dados entram na Onda 2 com o Cloud ativo."
        >
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Nenhum registro nesta aba.
          </div>
        </ProCard>
      )}
    </ProPage>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-foreground">{children}</dd>
    </div>
  );
}
