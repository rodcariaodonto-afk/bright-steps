import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AdminPage } from "@/components/admin/admin-page";
import { listAdminFamilies } from "@/modules/admin/api.functions";

export const Route = createFileRoute("/admin/families")({
  component: AdminFamilies,
});

function AdminFamilies() {
  const { t } = useTranslation("admin");
  const fetchFamilies = useServerFn(listAdminFamilies);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "families"],
    queryFn: () => fetchFamilies(),
  });

  return (
    <AdminPage title={t("sidebar.families")} description="Famílias ativas na plataforma.">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Responsável</th>
              <th className="px-4 py-2">Crianças</th>
              <th className="px-4 py-2">Criada em</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {data?.map((f) => (
              <tr key={f.id} className="border-t border-border/50">
                <td className="px-4 py-2 font-medium text-foreground">{f.name}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {f.owner?.full_name ?? f.owner?.email ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">{f.childrenCount}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Nenhuma família.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
