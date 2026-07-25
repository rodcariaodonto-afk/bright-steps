import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Users, Download } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/modules/billing/plans";
import {
  getFinanceMetrics,
  listRecentTransactions,
} from "@/modules/admin/commerce.functions";

export const Route = createFileRoute("/admin/finance")({
  component: AdminFinance,
});

function AdminFinance() {
  const metricsFn = useServerFn(getFinanceMetrics);
  const txFn = useServerFn(listRecentTransactions);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["admin", "finance-metrics"],
    queryFn: () => metricsFn(),
  });
  const { data: txs } = useQuery({
    queryKey: ["admin", "finance-tx"],
    queryFn: () => txFn(),
  });

  const cards = [
    { label: "MRR", value: metrics ? formatBRL(metrics.mrr) : "…", icon: DollarSign, color: "text-emerald-600" },
    { label: "ARR", value: metrics ? formatBRL(metrics.arr) : "…", icon: TrendingUp, color: "text-blue-600" },
    { label: "Receita 30d", value: metrics ? formatBRL(metrics.revenue30d) : "…", icon: DollarSign, color: "text-foreground" },
    { label: "Ticket médio", value: metrics ? formatBRL(metrics.ticketMedio) : "…", icon: Users, color: "text-foreground" },
    { label: "Assinantes ativos", value: metrics?.activeCount ?? "…", icon: Users, color: "text-foreground" },
    { label: "Churn 30d", value: metrics ? `${metrics.churnPct}%` : "…", icon: TrendingDown, color: "text-rose-600" },
  ];

  function exportCsv() {
    if (!txs) return;
    const header = "id,usuario,email,plano,valor,status,data\n";
    const rows = txs
      .map((t) =>
        [
          t.id,
          `"${t.user?.full_name ?? ""}"`,
          t.user?.email ?? "",
          `"${t.plan}"`,
          t.amount,
          t.status,
          t.created_at,
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminPage
      title="Financeiro"
      description="MRR, ARR, receita, churn e histórico consolidado de transações."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-border/60 bg-background p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </p>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className={`mt-2 text-2xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-border/60 bg-background p-4">
        <h3 className="text-sm font-semibold text-foreground">Receita mensal (12 meses)</h3>
        <div className="mt-3 h-64">
          {isLoading || !metrics ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Carregando gráfico...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => formatBRL(Number(v))}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border/60 bg-background">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Últimas 50 transações</h3>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={!txs?.length}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Usuário</th>
                <th className="px-3 py-2 text-left">Plano</th>
                <th className="px-3 py-2 text-right">Valor</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Data</th>
              </tr>
            </thead>
            <tbody>
              {!txs && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              )}
              {txs && txs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    Nenhuma transação registrada ainda.
                  </td>
                </tr>
              )}
              {(txs ?? []).map((t) => (
                <tr key={t.id} className="border-t border-border/40">
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">{t.user?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{t.user?.email ?? ""}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">{t.plan}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{formatBRL(t.amount)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        t.status === "active" || t.status === "trialing"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : t.status === "canceled"
                            ? "bg-neutral-500/15 text-neutral-600"
                            : "bg-amber-500/15 text-amber-700"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString("pt-BR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPage>
  );
}
