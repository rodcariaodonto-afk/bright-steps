import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { getProfessionalRepositories } from "@/modules/professional/repositories";

const patientsQuery = {
  queryKey: ["pro", "patients"],
  queryFn: () => getProfessionalRepositories().patients.list(),
};

export const Route = createFileRoute("/pro/pacientes")({
  loader: ({ context }) => context.queryClient.ensureQueryData(patientsQuery),
  component: PatientsPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Erro: {error.message}</div>
  ),
});

function ageFrom(iso: string) {
  const b = new Date(iso);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

function PatientsPage() {
  const { t } = useTranslation("pro");
  const { data: patients } = useSuspenseQuery(patientsQuery);

  return (
    <ProPage title={t("patients.title")} subtitle={t("patients.subtitle")}>
      {patients.length === 0 ? (
        <ProCard>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Nenhum paciente vinculado ainda
              </p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Peça para a família cadastrar você como profissional em
                Configurações , Profissionais vinculados, informando seu email.
              </p>
            </div>
          </div>
        </ProCard>
      ) : (
        <ProCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 font-medium">{t("patients.columns.name")}</th>
                  <th className="pb-2 font-medium">{t("patients.columns.age")}</th>
                  <th className="pb-2 font-medium">{t("patients.columns.diagnosis")}</th>
                  <th className="pb-2 font-medium">Interesse</th>
                  <th className="pb-2 font-medium">Acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {patients.map((p) => (
                  <tr key={p.id} className="text-sm">
                    <td className="py-3">
                      <Link
                        to="/pro/pacientes/$childId"
                        params={{ childId: p.id }}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {p.fullName}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">{ageFrom(p.birthDate)} anos</td>
                    <td className="py-3 text-muted-foreground">{p.diagnosis ?? ""}</td>
                    <td className="py-3 text-muted-foreground">{p.interests?.[0] ?? ""}</td>
                    <td className="py-3 text-muted-foreground">
                      {p.scopes.includes("session_write") ? "Escrita" : "Leitura"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ProCard>
      )}
    </ProPage>
  );
}
