import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { AdminPage } from "@/components/admin/admin-page";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { listAppSettings, updateAppSetting } from "@/modules/admin/system.functions";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const fetchSettings = useServerFn(listAppSettings);
  const save = useServerFn(updateAppSetting);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => fetchSettings(),
  });

  const mut = useMutation({
    mutationFn: (v: { key: string; value: unknown }) => save({ data: v }),
    onSuccess: () => { toast.success("Configuração salva"); qc.invalidateQueries({ queryKey: ["admin", "settings"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  return (
    <AdminPage
      title="Configurações Globais"
      description="Parâmetros usados em toda a plataforma."
    >
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((s: any) => (
          <SettingRow key={s.key} setting={s} onSave={(value) => mut.mutate({ key: s.key, value })} />
        ))}
      </div>
    </AdminPage>
  );
}

function SettingRow({ setting, onSave }: { setting: any; onSave: (v: unknown) => void }) {
  const isNumber = typeof setting.value === "number";
  const initial = typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value);
  const [val, setVal] = useState<string>(initial);
  useEffect(() => setVal(initial), [initial]);

  const dirty = val !== initial;

  return (
    <div className="rounded-xl border border-border/60 bg-background p-4">
      <Label className="font-mono text-xs">{setting.key}</Label>
      {setting.description && <p className="mt-1 text-xs text-muted-foreground">{setting.description}</p>}
      <Input
        type={isNumber ? "number" : "text"}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="mt-2"
      />
      <div className="mt-2 flex justify-end">
        <Button
          size="sm"
          disabled={!dirty}
          onClick={() => {
            let value: unknown = val;
            if (isNumber) value = Number(val);
            else {
              // Try JSON parse for arrays/objects/booleans; fallback to string
              try {
                if (val.trim().match(/^[\[{"]/) || val === "true" || val === "false" || val === "null") {
                  value = JSON.parse(val);
                } else {
                  value = val;
                }
              } catch { value = val; }
            }
            onSave(value);
          }}
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}
