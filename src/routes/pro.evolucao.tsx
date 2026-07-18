import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ProPage, ProCard } from "@/components/pro/pro-page";

export const Route = createFileRoute("/pro/evolucao")({
  component: EvolutionPage,
});

function EvolutionPage() {
  const { t } = useTranslation("pro");
  return (
    <ProPage title={t("evolution.title")} subtitle={t("evolution.subtitle")}>
      <div className="grid gap-4 lg:grid-cols-4">
        <ProCard title="Filtros">
          <div className="space-y-3 text-xs">
            <Filter label="Paciente" value="Todos" />
            <Filter label="Categoria" value="Todas" />
            <Filter label="Período" value="30 dias" />
            <Filter label="Compartilhado com" value="—" />
          </div>
        </ProCard>
        <ProCard className="lg:col-span-3" title="Feed cronológico">
          <ol className="relative space-y-6 border-l border-border pl-6">
            {[1, 2, 3].map((i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1 flex h-3 w-3 rounded-full bg-primary" />
                <p className="text-xs text-muted-foreground">
                  Há {i * 3} dias · Bento Alves
                </p>
                <p className="mt-1 text-sm text-foreground">
                  Registro de evolução ilustrativo. O feed real entra quando o
                  Cloud for ativado.
                </p>
                <div className="mt-2 flex gap-1.5">
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {t("evolution.shareWith.family")}
                  </span>
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                    {t("evolution.shareWith.school")}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </ProCard>
      </div>
    </ProPage>
  );
}

function Filter({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
