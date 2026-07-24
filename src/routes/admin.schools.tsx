import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AdminPage } from "@/components/admin/admin-page";
import { listAdminSchools } from "@/modules/admin/api.functions";

export const Route = createFileRoute("/admin/schools")({
  component: AdminSchools,
});

function AdminSchools() {
  const { t } = useTranslation("admin");
  const fetchSchools = useServerFn(listAdminSchools);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "schools"],
    queryFn: () => fetchSchools(),
  });

  return (
    <AdminPage title={t("sidebar.schools")} description="Escolas vinculadas às crianças.">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Escola</th>
              <th className="px-4 py-2">Série / Turma</th>
              <th className="px-4 py-2">Professor(a)</th>
              <th className="px-4 py-2">Criança</th>
              <th className="px-4 py-2">Vinculada em</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {data?.map((s) => (
              <tr key={s.id} className="border-t border-border/50">
                <td className="px-4 py-2 font-medium text-foreground">{s.name}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {[s.grade, s.class_name].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {s.teacher_name ?? "—"}
                  {s.teacher_email ? <span className="block text-xs">{s.teacher_email}</span> : null}
                </td>
                <td className="px-4 py-2 text-muted-foreground">{s.childName}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhuma escola vinculada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
