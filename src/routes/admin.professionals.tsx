import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AdminPage } from "@/components/admin/admin-page";
import { Badge } from "@/components/ui/badge";
import { listAdminProfessionals } from "@/modules/admin/api.functions";

export const Route = createFileRoute("/admin/professionals")({
  component: AdminProfessionals,
});

function AdminProfessionals() {
  const { t } = useTranslation("admin");
  const fetchPros = useServerFn(listAdminProfessionals);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "professionals"],
    queryFn: () => fetchPros(),
  });

  return (
    <AdminPage title={t("sidebar.professionals")} description="Profissionais cadastrados.">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Conselho</th>
              <th className="px-4 py-2">Especialidades</th>
              <th className="px-4 py-2">Pacientes</th>
              <th className="px-4 py-2">E,mail</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {data?.map((p) => (
              <tr key={p.id} className="border-t border-border/50">
                <td className="px-4 py-2 font-medium text-foreground">{p.full_name}</td>
                <td className="px-4 py-2 text-muted-foreground">{p.council_id ?? "—"}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {(p.specialties ?? []).map((s: string) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{p.patients}</td>
                <td className="px-4 py-2 text-muted-foreground">{p.email ?? "—"}</td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhum profissional.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
