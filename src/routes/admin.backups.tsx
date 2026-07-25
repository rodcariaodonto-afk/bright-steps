import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Database } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { listExportableTables, exportTableCsv, listAuditLog } from "@/modules/admin/system.functions";

export const Route = createFileRoute("/admin/backups")({
  component: AdminBackups,
});

function AdminBackups() {
  const fetchTables = useServerFn(listExportableTables);
  const doExport = useServerFn(exportTableCsv);
  const fetchLog = useServerFn(listAuditLog);

  const { data: tables, isLoading } = useQuery({
    queryKey: ["admin", "export-tables"],
    queryFn: () => fetchTables(),
  });

  const { data: log } = useQuery({
    queryKey: ["admin", "export-log"],
    queryFn: () => fetchLog({ data: { limit: 50 } }),
    select: (rows: any[]) => rows.filter((r) => r.action === "export.csv"),
  });

  const exportMut = useMutation({
    mutationFn: (table: string) => doExport({ data: { table } }),
    onSuccess: (res, table) => {
      if (!res.csv) {
        toast.info("Tabela vazia");
        return;
      }
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${res.rows} linhas exportadas`);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  return (
    <AdminPage
      title="Backups & Exportação"
      description="Exporte tabelas em CSV. Restauração completa é feita via Cloud → Configurações Avançadas → Export Data."
    >
      <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {(tables ?? []).map((t: any) => (
          <div key={t.table} className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-4">
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-mono text-xs">{t.table}</p>
                <p className="text-xs text-muted-foreground">{t.rows.toLocaleString("pt-BR")} linhas</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportMut.mutate(t.table)}
              disabled={exportMut.isPending}
            >
              <Download className="mr-2 h-3 w-3" /> CSV
            </Button>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-foreground">Últimas exportações</h2>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Admin</th>
              <th className="px-4 py-2">Tabela</th>
              <th className="px-4 py-2">Linhas</th>
            </tr>
          </thead>
          <tbody>
            {(log ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-border/50">
                <td className="px-4 py-2 text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.actor?.email ?? r.actor_id}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.target_id}</td>
                <td className="px-4 py-2">{r.metadata?.rows ?? 0}</td>
              </tr>
            ))}
            {(log ?? []).length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Nenhuma exportação registrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
