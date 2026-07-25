import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  listAdminReports,
  exportPlatformReport,
} from "@/modules/admin/reports.functions";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
});

function AdminReports() {
  const fetchReports = useServerFn(listAdminReports);
  const exportFn = useServerFn(exportPlatformReport);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: () => fetchReports(),
  });

  const [type, setType] = useState<"users" | "families" | "professionals" | "subscriptions" | "sessions">("users");
  const [range, setRange] = useState("30");

  const exportMut = useMutation({
    mutationFn: () =>
      exportFn({ data: { rangeDays: Number(range), type } }),
    onSuccess: (r) => {
      const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${range}d-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`CSV gerado (${r.count} linhas)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminPage title="Relatórios" description="Exporte dados da plataforma e consulte relatórios gerados.">
      <div className="mb-6 rounded-xl border border-border/60 bg-background p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">Exportar relatório consolidado</p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Tipo</label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="users">Usuários</SelectItem>
                <SelectItem value="families">Famílias</SelectItem>
                <SelectItem value="professionals">Profissionais</SelectItem>
                <SelectItem value="subscriptions">Assinaturas</SelectItem>
                <SelectItem value="sessions">Sessões clínicas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Período</label>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="365">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => exportMut.mutate()} disabled={exportMut.isPending}>
            <Download className="mr-2 h-4 w-4" />
            {exportMut.isPending ? "Gerando…" : "Gerar CSV"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <div className="border-b border-border/60 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Relatórios clínicos gerados</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Período</th>
              <th className="px-4 py-2">IA</th>
              <th className="px-4 py-2">Gerado em</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {data?.map((r) => (
              <tr key={r.id} className="border-t border-border/50">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {r.title}
                  </div>
                  {r.summary && <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.summary}</div>}
                </td>
                <td className="px-4 py-2"><Badge variant="outline">{r.kind}</Badge></td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {new Date(r.period_start).toLocaleDateString("pt-BR")} → {new Date(r.period_end).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-2">
                  {r.ai_generated ? <Badge>IA</Badge> : <Badge variant="secondary">Manual</Badge>}
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhum relatório gerado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
