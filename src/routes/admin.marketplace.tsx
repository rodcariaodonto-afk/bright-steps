import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye, EyeOff, Search, Star } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listMarketplaceProfessionals,
  moderateProfessional,
  toggleProfessionalVisibility,
} from "@/modules/admin/commerce.functions";

export const Route = createFileRoute("/admin/marketplace")({
  component: AdminMarketplace,
});

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  };
  const label: Record<string, string> = {
    approved: "Aprovado",
    pending: "Pendente",
    rejected: "Rejeitado",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] ?? ""}`}>
      {label[status] ?? status}
    </span>
  );
}

function AdminMarketplace() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const listFn = useServerFn(listMarketplaceProfessionals);
  const moderateFn = useServerFn(moderateProfessional);
  const toggleFn = useServerFn(toggleProfessionalVisibility);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "marketplace", status, search],
    queryFn: () => listFn({ data: { status, search } }),
  });

  const moderate = useMutation({
    mutationFn: (input: { id: string; status: "approved" | "rejected" | "pending" }) =>
      moderateFn({ data: input }),
    onSuccess: (_r, v) => {
      toast.success(`Profissional ${v.status === "approved" ? "aprovado" : v.status === "rejected" ? "rejeitado" : "revisado"}.`);
      qc.invalidateQueries({ queryKey: ["admin", "marketplace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleVis = useMutation({
    mutationFn: (input: { id: string; visible: boolean }) => toggleFn({ data: input }),
    onSuccess: () => {
      toast.success("Visibilidade atualizada.");
      qc.invalidateQueries({ queryKey: ["admin", "marketplace"] });
    },
  });

  const metrics = data?.metrics ?? { approved: 0, pending: 0, rejected: 0 };

  return (
    <AdminPage
      title="Marketplace"
      description="Modere profissionais listados publicamente e controle destaques."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Aprovados", value: metrics.approved, color: "text-emerald-600" },
          { label: "Pendentes", value: metrics.pending, color: "text-amber-600" },
          { label: "Rejeitados", value: metrics.rejected, color: "text-rose-600" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border/60 bg-background p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {m.label}
            </p>
            <p className={`mt-2 text-2xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Profissional</th>
              <th className="px-3 py-2 text-left">Conselho</th>
              <th className="px-3 py-2 text-left">Especialidades</th>
              <th className="px-3 py-2 text-left">Avaliação</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && (data?.items ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum profissional encontrado.
                </td>
              </tr>
            )}
            {(data?.items ?? []).map((p) => (
              <tr key={p.id} className="border-t border-border/40">
                <td className="px-3 py-2">
                  <div className="font-medium text-foreground">{p.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.city ?? "—"}
                    {p.state ? `, ${p.state}` : ""}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs">
                  {p.council_type ?? "—"} {p.council_number ?? ""}
                  {p.council_state ? `/${p.council_state}` : ""}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {(p.specialties ?? []).slice(0, 3).join(", ") || "—"}
                </td>
                <td className="px-3 py-2 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {Number(p.average_rating ?? 0).toFixed(1)}
                    <span className="text-muted-foreground">({p.reviews_count ?? 0})</span>
                  </span>
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={p.moderation_status} />
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-1">
                    {p.moderation_status !== "approved" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moderate.mutate({ id: p.id, status: "approved" })}
                        title="Aprovar"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </Button>
                    )}
                    {p.moderation_status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moderate.mutate({ id: p.id, status: "rejected" })}
                        title="Rejeitar"
                      >
                        <XCircle className="h-4 w-4 text-rose-600" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        toggleVis.mutate({ id: p.id, visible: !p.visible_in_marketplace })
                      }
                      title={p.visible_in_marketplace ? "Ocultar" : "Mostrar"}
                    >
                      {p.visible_in_marketplace ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
