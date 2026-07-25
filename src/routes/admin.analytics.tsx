import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { AdminPage } from "@/components/admin/admin-page";
import { getAnalyticsOverview } from "@/modules/admin/analytics.functions";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function AdminAnalytics() {
  const fetchOverview = useServerFn(getAnalyticsOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => fetchOverview(),
  });

  return (
    <AdminPage title="Analytics" description="Métricas em tempo real dos últimos 30 dias.">
      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Carregando dados…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Kpi label="Novos usuários" value={data.totals.newUsers} />
            <Kpi label="Novas famílias" value={data.totals.newFamilies} />
            <Kpi label="Novas crianças" value={data.totals.newChildren} />
            <Kpi label="Sessões clínicas" value={data.totals.sessions} />
            <Kpi label="Jogos concluídos" value={data.totals.gamesCompleted} />
            <Kpi label="Assinaturas ativas" value={data.totals.activeSubscriptions} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Novos usuários / dia</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.series.users}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border/60 bg-background p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Sessões clínicas / dia</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.series.sessions}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border/60 bg-background p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Jogos concluídos / dia</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.series.games}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border/60 bg-background p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Top 5 jogos (30d)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.topGames} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="title" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border/60 bg-background p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Distribuição de humor</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.moodDistribution} dataKey="count" nameKey="mood" outerRadius={80} label>
                    {data.moodDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border/60 bg-background p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Assinaturas ativas por plano</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.plans} dataKey="count" nameKey="plan" outerRadius={80} label>
                    {data.plans.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
