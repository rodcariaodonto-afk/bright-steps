import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { AdminPage } from "@/components/admin/admin-page";
import { listAuditLog } from "@/modules/admin/system.functions";

export const Route = createFileRoute("/admin/logs")({
  component: AdminLogs,
});

function AdminLogs() {
  const fetchLog = useServerFn(listAuditLog);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-log"],
    queryFn: () => fetchLog({ data: { limit: 500 } }),
  });

  return (
    <AdminPage title="Log de Auditoria" description="Últimas 500 ações administrativas.">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Quando</th>
              <th className="px-4 py-2">Admin</th>
              <th className="px-4 py-2">Ação</th>
              <th className="px-4 py-2">Alvo</th>
              <th className="px-4 py-2">Metadados</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>}
            {(data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-border/50 align-top">
                <td className="px-4 py-2 text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.actor?.email ?? r.actor_id}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.action}</td>
                <td className="px-4 py-2 text-xs">{r.target_type ? `${r.target_type}:${r.target_id}` : "—"}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  <code className="whitespace-pre-wrap">{r.metadata ? JSON.stringify(r.metadata) : ""}</code>
                </td>
              </tr>
            ))}
            {!isLoading && (data ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhuma ação registrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
