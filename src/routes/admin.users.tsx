import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AdminPage } from "@/components/admin/admin-page";
import { listAdminUsers } from "@/modules/admin/api.functions";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { t } = useTranslation("admin");
  const fetchUsers = useServerFn(listAdminUsers);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchUsers(),
  });

  return (
    <AdminPage title={t("sidebar.users")} description="Últimos 200 usuários cadastrados.">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">E,mail</th>
              <th className="px-4 py-2">Papéis</th>
              <th className="px-4 py-2">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {data?.map((u) => (
              <tr key={u.id} className="border-t border-border/50">
                <td className="px-4 py-2 font-medium text-foreground">{u.full_name ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{u.email ?? "—"}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 ? (
                      <Badge variant="outline">user</Badge>
                    ) : (
                      u.roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Nenhum usuário.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
