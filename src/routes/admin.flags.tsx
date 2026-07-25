import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminPage } from "@/components/admin/admin-page";
import { Switch } from "@/components/ui/switch";
import { listFeatureFlags, setFeatureFlag } from "@/modules/admin/system.functions";

export const Route = createFileRoute("/admin/flags")({
  component: AdminFlags,
});

function AdminFlags() {
  const fetchFlags = useServerFn(listFeatureFlags);
  const toggle = useServerFn(setFeatureFlag);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "flags"],
    queryFn: () => fetchFlags(),
  });

  const mut = useMutation({
    mutationFn: (v: { key: string; enabled: boolean }) => toggle({ data: v }),
    onSuccess: () => { toast.success("Flag atualizada"); qc.invalidateQueries({ queryKey: ["admin", "flags"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  return (
    <AdminPage
      title="Feature Flags"
      description="Ligue ou desligue módulos globalmente. Alterações são propagadas em tempo real."
    >
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Chave</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Última alteração</th>
              <th className="px-4 py-3 text-right">Ativa</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>}
            {(data ?? []).map((f: any) => (
              <tr key={f.key} className="border-t border-border/50">
                <td className="px-4 py-3 font-mono text-xs">{f.key}</td>
                <td className="px-4 py-3 text-muted-foreground">{f.description ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {f.updated_at ? new Date(f.updated_at).toLocaleString("pt-BR") : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Switch
                    checked={f.enabled}
                    disabled={mut.isPending}
                    onCheckedChange={(v) => mut.mutate({ key: f.key, enabled: v })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
