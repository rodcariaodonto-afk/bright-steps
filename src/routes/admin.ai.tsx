import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Send, RefreshCw } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listPersonaSettings,
  updatePersonaSettings,
  testPersona,
  listAiActivity,
} from "@/modules/admin/ai.functions";

export const Route = createFileRoute("/admin/ai")({
  component: AdminAI,
});

const MODEL_OPTIONS = [
  "google/gemini-3.6-flash",
  "google/gemini-3.5-flash",
  "google/gemini-3.1-flash-lite",
  "google/gemini-3.1-pro-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-5.4-mini",
  "openai/gpt-5.4",
  "openai/gpt-5.5",
];

function AdminAI() {
  return (
    <AdminPage
      title="Núcleo de IA (Azul)"
      description="Configure personas, teste respostas em tempo real e acompanhe atividade da IA."
    >
      <Tabs defaultValue="personas" className="w-full">
        <TabsList>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>
        <TabsContent value="personas" className="mt-6">
          <PersonasTab />
        </TabsContent>
        <TabsContent value="playground" className="mt-6">
          <PlaygroundTab />
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <ActivityTab />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}

function PersonasTab() {
  const fetchFn = useServerFn(listPersonaSettings);
  const updateFn = useServerFn(updatePersonaSettings);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "ai", "personas"],
    queryFn: () => fetchFn(),
  });

  const mut = useMutation({
    mutationFn: (v: any) => updateFn({ data: v }),
    onSuccess: () => {
      toast.success("Persona atualizada");
      qc.invalidateQueries({ queryKey: ["admin", "ai", "personas"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(data ?? []).map((p: any) => (
        <PersonaCard key={p.persona_id} persona={p} onSave={(v) => mut.mutate(v)} saving={mut.isPending} />
      ))}
    </div>
  );
}

function PersonaCard({
  persona,
  onSave,
  saving,
}: {
  persona: any;
  onSave: (v: any) => void;
  saving: boolean;
}) {
  const [model, setModel] = useState(persona.model);
  const [extra, setExtra] = useState(persona.extra_instructions ?? "");
  const [temp, setTemp] = useState(Number(persona.temperature ?? 0.7));
  const [enabled, setEnabled] = useState(!!persona.enabled);

  return (
    <div className="rounded-2xl border border-border/60 bg-background p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            {persona.display_name}
          </h3>
          <p className="text-xs font-mono text-muted-foreground">{persona.persona_id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`en-${persona.persona_id}`} className="text-xs">Ativa</Label>
          <Switch
            id={`en-${persona.persona_id}`}
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Modelo</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Temperatura ({temp.toFixed(2)})</Label>
          <Input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
          />
        </div>

        <div>
          <Label className="text-xs">Instruções extras (opcional)</Label>
          <Textarea
            rows={4}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Instruções que serão anexadas ao system prompt desta persona."
          />
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={saving}
            onClick={() =>
              onSave({
                persona_id: persona.persona_id,
                model,
                extra_instructions: extra,
                temperature: temp,
                enabled,
              })
            }
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlaygroundTab() {
  const fetchFn = useServerFn(listPersonaSettings);
  const runFn = useServerFn(testPersona);
  const { data: personas } = useQuery({
    queryKey: ["admin", "ai", "personas"],
    queryFn: () => fetchFn(),
  });

  const [personaId, setPersonaId] = useState("family");
  const [prompt, setPrompt] = useState("Como posso ajudar minha filha de 6 anos a lidar com mudanças na rotina?");
  const [response, setResponse] = useState<{ text: string; model: string; latencyMs: number } | null>(null);

  const mut = useMutation({
    mutationFn: () => runFn({ data: { persona_id: personaId, prompt } }),
    onSuccess: (r) => setResponse(r),
    onError: (e: any) => toast.error(e.message ?? "Falha ao testar"),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-border/60 bg-background p-5">
        <div>
          <Label className="text-xs">Persona</Label>
          <Select value={personaId} onValueChange={setPersonaId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(personas ?? []).map((p: any) => (
                <SelectItem key={p.persona_id} value={p.persona_id}>{p.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Mensagem de teste</Label>
          <Textarea rows={8} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending || !prompt.trim()}>
          {mut.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Enviar
        </Button>
      </div>
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
        <h4 className="mb-2 text-sm font-semibold">Resposta da Azul</h4>
        {response ? (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              {response.model} · {response.latencyMs}ms
            </p>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{response.text}</div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Envie uma mensagem para ver a resposta.</p>
        )}
      </div>
    </div>
  );
}

function ActivityTab() {
  const fetchFn = useServerFn(listAiActivity);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "ai", "activity"],
    queryFn: () => fetchFn(),
  });

  return (
    <div className="rounded-2xl border border-border/60 bg-background">
      <div className="flex items-center justify-between border-b border-border/50 p-4">
        <h3 className="text-sm font-semibold">Últimas ações da IA</h3>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Ação</th>
            <th className="px-4 py-2">Alvo</th>
            <th className="px-4 py-2">Detalhes</th>
            <th className="px-4 py-2">Quando</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>
          )}
          {!isLoading && (data ?? []).length === 0 && (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Sem atividade registrada ainda.</td></tr>
          )}
          {(data ?? []).map((row: any) => (
            <tr key={row.id} className="border-t border-border/50">
              <td className="px-4 py-2 font-mono text-xs">{row.action}</td>
              <td className="px-4 py-2 text-xs">{row.target_id ?? "—"}</td>
              <td className="px-4 py-2 text-xs text-muted-foreground">
                {row.metadata ? JSON.stringify(row.metadata) : "—"}
              </td>
              <td className="px-4 py-2 text-xs text-muted-foreground">
                {new Date(row.created_at).toLocaleString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
