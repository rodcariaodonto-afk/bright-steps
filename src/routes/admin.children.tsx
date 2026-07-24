import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AdminPage } from "@/components/admin/admin-page";
import { listAdminChildren } from "@/modules/admin/api.functions";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/children")({
  component: AdminChildren,
});

function ageFrom(birth?: string | null) {
  if (!birth) return "—";
  const d = new Date(birth);
  const diff = Date.now() - d.getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return `${years} anos`;
}

function AdminChildren() {
  const { t } = useTranslation("admin");
  const fetchChildren = useServerFn(listAdminChildren);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "children"],
    queryFn: () => fetchChildren(),
  });

  return (
    <AdminPage title={t("sidebar.children")} description="Crianças cadastradas na plataforma.">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Apelido</th>
              <th className="px-4 py-2">Idade</th>
              <th className="px-4 py-2">Condições declaradas</th>
              <th className="px-4 py-2">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {data?.map((c) => (
              <tr key={c.id} className="border-t border-border/50">
                <td className="px-4 py-2 font-medium text-foreground">{c.full_name}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.nickname ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{ageFrom(c.birth_date)}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {(c.declared_conditions ?? []).map((cond: string) => (
                      <Badge key={cond} variant="secondary">{cond}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhuma criança.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
