import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { getProfessionalRepositories } from "@/modules/professional/repositories";
import { PatternsCard } from "@/components/insights/patterns-card";
import { cn } from "@/lib/utils";

function childQuery(childId: string) {
  return {
    queryKey: ["pro", "patient", childId],
    queryFn: async () => {
      const repos = getProfessionalRepositories();
      const [patient, goals, sessions, evolution] = await Promise.all([
        repos.patients.get(childId),
        repos.goals.listByChild(childId),
        repos.sessions.listByChild(childId),
        repos.evolution.listByChild(childId),
      ]);
      if (!patient) throw notFound();
      return { patient, goals, sessions, evolution };
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
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Erro: {error.message}</div>
  ),
});

const TABS = ["overview", "sessions", "evolution", "goals"] as const;
type TabKey = (typeof TABS)[number];
const TAB_LABEL: Record<TabKey, string> = {
  overview: "Visão geral",
  sessions: "Sessões",
  evolution: "Evolução",
  goals: "Objetivos",
};

function ageFrom(iso: string) {
  const b = new Date(iso);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

function PatientDetail() {
  const { childId } = Route.useParams();
  useTranslation("pro");
  const { data } = useSuspenseQuery(childQuery(childId));
  const [tab, setTab] = useState<TabKey>("overview");

  const p = data.patient;

  return (
    <ProPage
      title={p.fullName}
      subtitle={`${ageFrom(p.birthDate)} anos${p.diagnosis ? ` · ${p.diagnosis}` : ""}${p.interests?.[0] ? ` · interesse: ${p.interests[0]}` : ""}`}
      actions={
        <Link to="/pro/pacientes" className="text-xs text-muted-foreground hover:text-foreground">
          ← voltar
        </Link>
      }
    >
      <nav className="flex gap-1 overflow-x-auto rounded-lg border border-border/60 bg-card p-1">
        {TABS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {TAB_LABEL[k]}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="grid gap-4 md:grid-cols-3">
          <ProCard title="Resumo">
            <dl className="space-y-2 text-sm">
              <Row label="Idade">{ageFrom(p.birthDate)} anos</Row>
              <Row label="Diagnóstico">{p.diagnosis ?? "—"}</Row>
              <Row label="Interesses">{p.interests?.join(", ") || "—"}</Row>
              <Row label="Acesso">{p.scopes.includes("session_write") ? "Escrita" : "Leitura"}</Row>
            </dl>
          </ProCard>
          <ProCard title="Sessões" description={`${data.sessions.length} registradas`}>
            <p className="text-2xl font-bold">{data.sessions.length}</p>
          </ProCard>
          <ProCard title="Evolução" description={`${data.evolution.length} registros`}>
            <p className="text-2xl font-bold">{data.evolution.length}</p>
          </ProCard>
          </ProCard>
          <div className="md:col-span-3">
            <PatternsCard childId={childId} variant="pro" />
          </div>
        </div>
      )}

      {tab === "sessions" && (
        <ProCard title="Sessões clínicas">
          {data.sessions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Nenhuma sessão registrada.{" "}
              <Link to="/pro/sessoes/nova" className="text-primary hover:underline">Registrar agora</Link>
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {data.sessions.map((s) => (
                <li key={s.id} className="py-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(s.date).toLocaleString("pt-BR")}</span>
                    <span>{s.durationMinutes} min</span>
                  </div>
                  <p className="mt-1 text-sm text-foreground">{s.activities}</p>
                  {s.observations && (
                    <p className="mt-1 text-xs text-muted-foreground">Obs.: {s.observations}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ProCard>
      )}

      {tab === "evolution" && (
        <ProCard title="Evolução">
          {data.evolution.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Nenhum registro de evolução.
            </p>
          ) : (
            <ol className="relative space-y-5 border-l border-border pl-6">
              {data.evolution.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary" />
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{e.text}</p>
                </li>
              ))}
            </ol>
          )}
        </ProCard>
      )}

      {tab === "goals" && (
        <ProCard title="Objetivos terapêuticos">
          {data.goals.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Nenhum objetivo definido.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.goals.map((g) => (
                <li key={g.id} className="rounded-lg border border-border/60 p-3">
                  <p className="text-sm font-medium text-foreground">{g.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.category} · {g.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ProCard>
      )}
    </ProPage>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  );
}
