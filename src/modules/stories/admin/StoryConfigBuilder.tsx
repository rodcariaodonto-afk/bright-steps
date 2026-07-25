import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import type { BranchingConfig, BranchingNode, LinearConfig, StoryType } from "../types";
import { STORY_ENGINES } from "../story-registry";

interface Props {
  storyType: StoryType;
  config: unknown;
  onChange: (config: unknown) => void;
}

export function StoryConfigBuilder({ storyType, config, onChange }: Props) {
  useEffect(() => {
    if (!config || Object.keys(config as object).length === 0) {
      onChange(STORY_ENGINES[storyType].defaultConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyType]);

  if (storyType === "linear") return <LinearBuilder config={config as LinearConfig} onChange={onChange} />;
  if (storyType === "branching") return <BranchingBuilder config={config as BranchingConfig} onChange={onChange} />;
  return <p className="text-sm text-muted-foreground">Tipo desconhecido.</p>;
}

/* ---------- LINEAR ---------- */
function LinearBuilder({ config, onChange }: { config: LinearConfig; onChange: (c: LinearConfig) => void }) {
  const pages = config?.pages ?? [];
  const update = (idx: number, patch: Partial<(typeof pages)[number]>) => {
    const next = pages.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onChange({ pages: next });
  };
  const add = () => onChange({ pages: [...pages, { emoji: "🌟", text: "" }] });
  const remove = (idx: number) => onChange({ pages: pages.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-3">
      {pages.map((p, i) => (
        <Card key={i} className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Página {i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => remove(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-[100px_1fr]">
            <div>
              <Label className="text-xs">Emoji</Label>
              <Input value={p.emoji ?? ""} maxLength={4} onChange={(e) => update(i, { emoji: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">URL imagem (opcional)</Label>
              <Input value={p.imageUrl ?? ""} onChange={(e) => update(i, { imageUrl: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Texto</Label>
            <Textarea rows={3} value={p.text} onChange={(e) => update(i, { text: e.target.value })} />
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={add}><Plus className="mr-1 h-4 w-4" />Adicionar página</Button>
    </div>
  );
}

/* ---------- BRANCHING ---------- */
function BranchingBuilder({ config, onChange }: { config: BranchingConfig; onChange: (c: BranchingConfig) => void }) {
  const [startId, setStartId] = useState(config?.startId ?? "");
  const nodes = config?.nodes ?? [];

  useEffect(() => setStartId(config?.startId ?? ""), [config?.startId]);

  const updateNode = (idx: number, patch: Partial<BranchingNode>) => {
    const next = nodes.map((n, i) => (i === idx ? { ...n, ...patch } : n));
    onChange({ startId, nodes: next });
  };
  const removeNode = (idx: number) => onChange({ startId, nodes: nodes.filter((_, i) => i !== idx) });
  const addNode = () =>
    onChange({ startId, nodes: [...nodes, { id: `no_${nodes.length + 1}`, emoji: "✨", text: "", choices: [] }] });

  const addChoice = (nodeIdx: number) => {
    const n = nodes[nodeIdx];
    updateNode(nodeIdx, { choices: [...(n.choices ?? []), { label: "Nova escolha", next: "", reward: 0 }] });
  };
  const updateChoice = (nodeIdx: number, cIdx: number, patch: Partial<BranchingNode["choices"] extends (infer X)[] | undefined ? X : never>) => {
    const n = nodes[nodeIdx];
    const choices = (n.choices ?? []).map((c, i) => (i === cIdx ? { ...c, ...patch } : c));
    updateNode(nodeIdx, { choices });
  };
  const removeChoice = (nodeIdx: number, cIdx: number) => {
    const n = nodes[nodeIdx];
    updateNode(nodeIdx, { choices: (n.choices ?? []).filter((_, i) => i !== cIdx) });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
        <div>
          <Label className="text-xs">Nó inicial</Label>
          <Input
            value={startId}
            onChange={(e) => {
              setStartId(e.target.value);
              onChange({ startId: e.target.value, nodes });
            }}
            placeholder="inicio"
          />
        </div>
      </div>

      {nodes.map((n, i) => (
        <Card key={i} className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Nó #{i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => removeNode(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <Label className="text-xs">ID</Label>
              <Input value={n.id} onChange={(e) => updateNode(i, { id: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Emoji</Label>
              <Input value={n.emoji ?? ""} maxLength={4} onChange={(e) => updateNode(i, { emoji: e.target.value })} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={!!n.ending}
                  onChange={(e) => updateNode(i, { ending: e.target.checked })}
                />
                Final da história
              </label>
            </div>
          </div>
          <div>
            <Label className="text-xs">Texto</Label>
            <Textarea rows={2} value={n.text} onChange={(e) => updateNode(i, { text: e.target.value })} />
          </div>

          {!n.ending && (
            <div className="space-y-2 rounded-lg border border-dashed p-2">
              <p className="text-xs font-bold text-muted-foreground">Escolhas</p>
              {(n.choices ?? []).map((c, cIdx) => (
                <div key={cIdx} className="grid gap-2 sm:grid-cols-[1fr_140px_80px_40px]">
                  <Input
                    value={c.label}
                    onChange={(e) => updateChoice(i, cIdx, { label: e.target.value })}
                    placeholder="Rótulo"
                  />
                  <Input
                    value={c.next}
                    onChange={(e) => updateChoice(i, cIdx, { next: e.target.value })}
                    placeholder="ID destino"
                  />
                  <Input
                    type="number"
                    value={c.reward ?? 0}
                    onChange={(e) => updateChoice(i, cIdx, { reward: Number(e.target.value) })}
                    placeholder="Recompensa"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeChoice(i, cIdx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addChoice(i)}>
                <Plus className="mr-1 h-4 w-4" />Adicionar escolha
              </Button>
            </div>
          )}
        </Card>
      ))}

      <Button variant="outline" onClick={addNode}><Plus className="mr-1 h-4 w-4" />Adicionar nó</Button>
    </div>
  );
}
