import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { Button } from "@/components/ui/button";
import { getProfessionalRepositories } from "@/modules/professional/repositories";

const patientsQuery = {
  queryKey: ["pro", "patients"],
  queryFn: () => getProfessionalRepositories().patients.list(),
};

export const Route = createFileRoute("/pro/pacientes")({
  loader: ({ context }) => context.queryClient.ensureQueryData(patientsQuery),
  component: PatientsPage,
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
    <ProPage
      title={t("patients.title")}
      subtitle={t("patients.subtitle")}
      actions={
        <div className="flex gap-1.5 text-xs">
          <Button size="sm" variant="secondary">
            {t("patients.filters.active")}
          </Button>
          <Button size="sm" variant="ghost">
            {t("patients.filters.all")}
          </Button>
          <Button size="sm" variant="ghost">
            {t("patients.filters.byDiagnosis")}
          </Button>
        </div>
      }
    >
      <ProCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-medium">{t("patients.columns.name")}</th>
                <th className="pb-2 font-medium">{t("patients.columns.age")}</th>
                <th className="pb-2 font-medium">
                  {t("patients.columns.diagnosis")}
                </th>
                <th className="pb-2 font-medium">
                  {t("patients.columns.support")}
                </th>
                <th className="pb-2 font-medium">
                  {t("patients.columns.nextSession")}
                </th>
                <th className="pb-2 font-medium">
                  {t("patients.columns.goalsProgress")}
                </th>
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
                  <td className="py-3 text-muted-foreground">
                    {ageFrom(p.birthDate)} anos
                  </td>
                  <td className="py-3 text-muted-foreground">{p.diagnosis}</td>
                  <td className="py-3 text-muted-foreground">
                    Nível {p.supportLevel}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {p.nextSessionAt
                      ? new Date(p.nextSessionAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${p.goalsProgress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {p.goalsProgress ?? 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ProCard>
    </ProPage>
  );
}
