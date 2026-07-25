import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface Props {
  engineCode: string | null | undefined;
  config: any;
  onChange: (next: any) => void;
}

const uid = () => Math.random().toString(36).slice(2, 8);

export function GameConfigBuilder({ engineCode, config, onChange }: Props) {
  const cfg = config ?? {};
  const set = (patch: any) => onChange({ ...cfg, ...patch });

  switch (engineCode) {
    case "quiz":
      return <QuizBuilder cfg={cfg} set={set} onChange={onChange} />;
    case "memory":
      return <MemoryBuilder cfg={cfg} set={set} onChange={onChange} />;
    case "drag_drop":
      return <DragDropBuilder cfg={cfg} set={set} onChange={onChange} />;
    case "sequence":
      return <SequenceBuilder cfg={cfg} set={set} onChange={onChange} />;
    case "categorization":
      return <CategorizationBuilder cfg={cfg} set={set} onChange={onChange} />;
    case "branching_story":
      return <BranchingStoryBuilder cfg={cfg} set={set} onChange={onChange} />;
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Este motor ainda não possui editor visual. Use a aba JSON.
        </p>
      );
  }
}

type BuilderProps = { cfg: any; set: (patch: any) => void; onChange: (next: any) => void };

// ---------- QUIZ ----------
function QuizBuilder({ cfg, set }: BuilderProps) {
  const questions: any[] = cfg.questions ?? [];
  const update = (i: number, patch: any) => {
    const next = [...questions];
    next[i] = { ...next[i], ...patch };
    set({ questions: next });
  };
  const remove = (i: number) => set({ questions: questions.filter((_, k) => k !== i) });
  const add = () =>
    set({
      questions: [...questions, { prompt: "", options: ["", ""], correctIndex: 0, explanation: "" }],
    });

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!cfg.shuffleOptions} onChange={(e) => set({ shuffleOptions: e.target.checked })} />
          Embaralhar opções
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={cfg.showExplanation !== false} onChange={(e) => set({ showExplanation: e.target.checked })} />
          Mostrar explicação
        </label>
      </div>
      {questions.map((q, i) => (
        <Card key={i} className="grid gap-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pergunta {i + 1}</span>
            <Button size="sm" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
          <Input placeholder="Enunciado" value={q.prompt ?? ""} onChange={(e) => update(i, { prompt: e.target.value })} />
          <div className="grid gap-1">
            {(q.options ?? []).map((opt: string, j: number) => (
              <div key={j} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${i}`}
                  checked={q.correctIndex === j}
                  onChange={() => update(i, { correctIndex: j })}
                  title="Correta"
                />
                <Input
                  placeholder={`Opção ${j + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const opts = [...q.options];
                    opts[j] = e.target.value;
                    update(i, { options: opts });
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const opts = q.options.filter((_: any, k: number) => k !== j);
                    update(i, {
                      options: opts,
                      correctIndex: q.correctIndex >= opts.length ? 0 : q.correctIndex,
                    });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => update(i, { options: [...(q.options ?? []), ""] })}>
              <Plus className="mr-1 h-3.5 w-3.5" />Adicionar opção
            </Button>
          </div>
          <Textarea rows={2} placeholder="Explicação (opcional)" value={q.explanation ?? ""} onChange={(e) => update(i, { explanation: e.target.value })} />
        </Card>
      ))}
      <Button variant="outline" onClick={add}><Plus className="mr-2 h-4 w-4" />Adicionar pergunta</Button>
    </div>
  );
}

// ---------- MEMORY ----------
function MemoryBuilder({ cfg, set }: BuilderProps) {
  const pairs: any[] = cfg.pairs ?? [];
  const update = (i: number, patch: any) => {
    const n = [...pairs];
    n[i] = { ...n[i], ...patch };
    set({ pairs: n });
  };
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Grid</Label>
          <Select value={cfg.gridSize ?? "3x4"} onValueChange={(v) => set({ gridSize: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["2x2", "2x3", "3x4", "4x4", "4x5"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Limite de tempo (seg, 0 = sem)</Label>
          <Input type="number" value={cfg.timeLimitSec ?? 0} onChange={(e) => set({ timeLimitSec: Number(e.target.value) || 0 })} />
        </div>
      </div>
      {pairs.map((p, i) => (
        <Card key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 p-3">
          <div className="grid gap-1"><Label className="text-xs">Rótulo</Label>
            <Input value={p.label ?? ""} onChange={(e) => update(i, { label: e.target.value })} /></div>
          <div className="grid gap-1"><Label className="text-xs">Emoji</Label>
            <Input value={p.emoji ?? ""} onChange={(e) => update(i, { emoji: e.target.value })} placeholder="🐶" /></div>
          <div className="grid gap-1"><Label className="text-xs">ID</Label>
            <Input value={p.id ?? ""} onChange={(e) => update(i, { id: e.target.value })} /></div>
          <Button size="sm" variant="ghost" onClick={() => set({ pairs: pairs.filter((_, k) => k !== i) })}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </Card>
      ))}
      <Button variant="outline" onClick={() => set({ pairs: [...pairs, { id: uid(), label: "", emoji: "" }] })}>
        <Plus className="mr-2 h-4 w-4" />Adicionar par
      </Button>
    </div>
  );
}

// ---------- DRAG DROP ----------
function DragDropBuilder({ cfg, set }: BuilderProps) {
  const buckets: any[] = cfg.buckets ?? [];
  const items: any[] = cfg.items ?? [];
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>Enunciado</Label>
        <Input value={cfg.prompt ?? ""} onChange={(e) => set({ prompt: e.target.value })} />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Grupos (buckets)</p>
        <div className="grid gap-2">
          {buckets.map((b, i) => (
            <Card key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 p-3">
              <div className="grid gap-1"><Label className="text-xs">ID</Label>
                <Input value={b.id ?? ""} onChange={(e) => {
                  const n = [...buckets]; n[i] = { ...b, id: e.target.value }; set({ buckets: n });
                }} /></div>
              <div className="grid gap-1"><Label className="text-xs">Rótulo</Label>
                <Input value={b.label ?? ""} onChange={(e) => {
                  const n = [...buckets]; n[i] = { ...b, label: e.target.value }; set({ buckets: n });
                }} /></div>
              <div className="grid gap-1"><Label className="text-xs">Emoji</Label>
                <Input value={b.emoji ?? ""} onChange={(e) => {
                  const n = [...buckets]; n[i] = { ...b, emoji: e.target.value }; set({ buckets: n });
                }} /></div>
              <Button size="sm" variant="ghost" onClick={() => set({ buckets: buckets.filter((_, k) => k !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </Card>
          ))}
          <Button variant="outline" size="sm" onClick={() => set({ buckets: [...buckets, { id: uid(), label: "", emoji: "" }] })}>
            <Plus className="mr-2 h-4 w-4" />Adicionar grupo
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Itens</p>
        <div className="grid gap-2">
          {items.map((it, i) => (
            <Card key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 p-3">
              <div className="grid gap-1"><Label className="text-xs">Rótulo</Label>
                <Input value={it.label ?? ""} onChange={(e) => {
                  const n = [...items]; n[i] = { ...it, label: e.target.value }; set({ items: n });
                }} /></div>
              <div className="grid gap-1"><Label className="text-xs">Emoji</Label>
                <Input value={it.emoji ?? ""} onChange={(e) => {
                  const n = [...items]; n[i] = { ...it, emoji: e.target.value }; set({ items: n });
                }} /></div>
              <div className="grid gap-1"><Label className="text-xs">Grupo correto</Label>
                <Select value={it.correctBucket ?? ""} onValueChange={(v) => {
                  const n = [...items]; n[i] = { ...it, correctBucket: v }; set({ items: n });
                }}>
                  <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                  <SelectContent>
                    {buckets.filter((b) => b.id).map((b) => <SelectItem key={b.id} value={b.id}>{b.label || b.id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" variant="ghost" onClick={() => set({ items: items.filter((_, k) => k !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </Card>
          ))}
          <Button variant="outline" size="sm" onClick={() => set({ items: [...items, { id: uid(), label: "", emoji: "", correctBucket: buckets[0]?.id ?? "" }] })}>
            <Plus className="mr-2 h-4 w-4" />Adicionar item
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- SEQUENCE ----------
function SequenceBuilder({ cfg, set }: BuilderProps) {
  const items: any[] = cfg.items ?? [];
  const order: string[] = cfg.order ?? [];

  const setItems = (n: any[]) => set({ items: n });
  const setOrder = (n: string[]) => set({ order: n });

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const n = [...order];
    [n[i], n[j]] = [n[j], n[i]];
    setOrder(n);
  };

  return (
    <div className="grid gap-3">
      <Input placeholder="Enunciado" value={cfg.prompt ?? ""} onChange={(e) => set({ prompt: e.target.value })} />
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={cfg.shuffle !== false} onChange={(e) => set({ shuffle: e.target.checked })} />
        Embaralhar na hora de jogar
      </label>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Itens</p>
        {items.map((it, i) => (
          <Card key={i} className="mb-2 grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 p-3">
            <div className="grid gap-1"><Label className="text-xs">ID</Label>
              <Input value={it.id ?? ""} onChange={(e) => {
                const n = [...items]; n[i] = { ...it, id: e.target.value }; setItems(n);
              }} /></div>
            <div className="grid gap-1"><Label className="text-xs">Rótulo</Label>
              <Input value={it.label ?? ""} onChange={(e) => {
                const n = [...items]; n[i] = { ...it, label: e.target.value }; setItems(n);
              }} /></div>
            <div className="grid gap-1"><Label className="text-xs">Emoji</Label>
              <Input value={it.emoji ?? ""} onChange={(e) => {
                const n = [...items]; n[i] = { ...it, emoji: e.target.value }; setItems(n);
              }} /></div>
            <Button size="sm" variant="ghost" onClick={() => setItems(items.filter((_, k) => k !== i))}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Card>
        ))}
        <Button variant="outline" size="sm" onClick={() => setItems([...items, { id: uid(), label: "", emoji: "" }])}>
          <Plus className="mr-2 h-4 w-4" />Adicionar item
        </Button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Ordem correta</p>
        <div className="grid gap-2">
          {order.map((id, i) => {
            const it = items.find((x) => x.id === id);
            return (
              <Card key={i} className="flex items-center gap-2 p-2">
                <span className="w-6 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                <span className="flex-1 text-sm">{it?.emoji} {it?.label ?? id}</span>
                <Button size="sm" variant="ghost" onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setOrder(order.filter((_, k) => k !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
              </Card>
            );
          })}
          <Select value="" onValueChange={(v) => setOrder([...order, v])}>
            <SelectTrigger><SelectValue placeholder="+ adicionar item à ordem" /></SelectTrigger>
            <SelectContent>
              {items.filter((it) => it.id).map((it) => (
                <SelectItem key={it.id} value={it.id}>{it.emoji} {it.label || it.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ---------- CATEGORIZATION ----------
function CategorizationBuilder({ cfg, set }: BuilderProps) {
  const categories: any[] = cfg.categories ?? [];
  const items: any[] = cfg.items ?? [];
  return (
    <div className="grid gap-3">
      <Input placeholder="Enunciado" value={cfg.prompt ?? ""} onChange={(e) => set({ prompt: e.target.value })} />
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={!!cfg.oneAtATime} onChange={(e) => set({ oneAtATime: e.target.checked })} />
        Mostrar um item por vez
      </label>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Categorias</p>
        {categories.map((c, i) => (
          <Card key={i} className="mb-2 grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 p-3">
            <div className="grid gap-1"><Label className="text-xs">ID</Label>
              <Input value={c.id ?? ""} onChange={(e) => { const n = [...categories]; n[i] = { ...c, id: e.target.value }; set({ categories: n }); }} /></div>
            <div className="grid gap-1"><Label className="text-xs">Rótulo</Label>
              <Input value={c.label ?? ""} onChange={(e) => { const n = [...categories]; n[i] = { ...c, label: e.target.value }; set({ categories: n }); }} /></div>
            <div className="grid gap-1"><Label className="text-xs">Emoji</Label>
              <Input value={c.emoji ?? ""} onChange={(e) => { const n = [...categories]; n[i] = { ...c, emoji: e.target.value }; set({ categories: n }); }} /></div>
            <Button size="sm" variant="ghost" onClick={() => set({ categories: categories.filter((_, k) => k !== i) })}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Card>
        ))}
        <Button variant="outline" size="sm" onClick={() => set({ categories: [...categories, { id: uid(), label: "", emoji: "" }] })}>
          <Plus className="mr-2 h-4 w-4" />Adicionar categoria
        </Button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Itens</p>
        {items.map((it, i) => (
          <Card key={i} className="mb-2 grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 p-3">
            <div className="grid gap-1"><Label className="text-xs">Rótulo</Label>
              <Input value={it.label ?? ""} onChange={(e) => { const n = [...items]; n[i] = { ...it, label: e.target.value }; set({ items: n }); }} /></div>
            <div className="grid gap-1"><Label className="text-xs">Emoji</Label>
              <Input value={it.emoji ?? ""} onChange={(e) => { const n = [...items]; n[i] = { ...it, emoji: e.target.value }; set({ items: n }); }} /></div>
            <div className="grid gap-1"><Label className="text-xs">Categoria correta</Label>
              <Select value={it.correctCategory ?? ""} onValueChange={(v) => { const n = [...items]; n[i] = { ...it, correctCategory: v }; set({ items: n }); }}>
                <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.id).map((c) => <SelectItem key={c.id} value={c.id}>{c.label || c.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="ghost" onClick={() => set({ items: items.filter((_, k) => k !== i) })}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Card>
        ))}
        <Button variant="outline" size="sm" onClick={() => set({ items: [...items, { id: uid(), label: "", emoji: "", correctCategory: categories[0]?.id ?? "" }] })}>
          <Plus className="mr-2 h-4 w-4" />Adicionar item
        </Button>
      </div>
    </div>
  );
}

// ---------- BRANCHING STORY ----------
function BranchingStoryBuilder({ cfg, set }: BuilderProps) {
  const nodes: any[] = cfg.nodes ?? [];
  const updateNode = (i: number, patch: any) => {
    const n = [...nodes]; n[i] = { ...n[i], ...patch }; set({ nodes: n });
  };
  const nodeIds = nodes.map((n) => n.id).filter(Boolean);

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>Nó inicial</Label>
        <Select value={cfg.startId ?? ""} onValueChange={(v) => set({ startId: v })}>
          <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
          <SelectContent>
            {nodeIds.map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {nodes.map((node, i) => (
        <Card key={i} className="grid gap-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Nó {i + 1}</span>
            <Button size="sm" variant="ghost" onClick={() => set({ nodes: nodes.filter((_, k) => k !== i) })}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-[1fr_100px_auto] gap-2">
            <Input placeholder="ID único" value={node.id ?? ""} onChange={(e) => updateNode(i, { id: e.target.value })} />
            <Input placeholder="Emoji" value={node.emoji ?? ""} onChange={(e) => updateNode(i, { emoji: e.target.value })} />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={!!node.ending} onChange={(e) => updateNode(i, { ending: e.target.checked })} />
              Final
            </label>
          </div>
          <Textarea rows={2} placeholder="Texto do nó" value={node.text ?? ""} onChange={(e) => updateNode(i, { text: e.target.value })} />
          <Input placeholder="URL da imagem (opcional)" value={node.imageUrl ?? ""} onChange={(e) => updateNode(i, { imageUrl: e.target.value })} />

          {!node.ending && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Escolhas</p>
              {(node.choices ?? []).map((c: any, j: number) => (
                <div key={j} className="mb-1 grid grid-cols-[1fr_1fr_80px_auto] gap-1">
                  <Input placeholder="Rótulo" value={c.label ?? ""} onChange={(e) => {
                    const ch = [...(node.choices ?? [])]; ch[j] = { ...c, label: e.target.value }; updateNode(i, { choices: ch });
                  }} />
                  <Select value={c.next ?? ""} onValueChange={(v) => {
                    const ch = [...(node.choices ?? [])]; ch[j] = { ...c, next: v }; updateNode(i, { choices: ch });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Próximo nó" /></SelectTrigger>
                    <SelectContent>
                      {nodeIds.filter((id) => id !== node.id).map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" step="0.1" placeholder="Reward" value={c.reward ?? 0} onChange={(e) => {
                    const ch = [...(node.choices ?? [])]; ch[j] = { ...c, reward: Number(e.target.value) || 0 }; updateNode(i, { choices: ch });
                  }} />
                  <Button size="sm" variant="ghost" onClick={() => {
                    const ch = (node.choices ?? []).filter((_: any, k: number) => k !== j);
                    updateNode(i, { choices: ch });
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => updateNode(i, { choices: [...(node.choices ?? []), { label: "", next: "", reward: 0 }] })}>
                <Plus className="mr-1 h-3.5 w-3.5" />Adicionar escolha
              </Button>
            </div>
          )}
        </Card>
      ))}
      <Button variant="outline" onClick={() => set({ nodes: [...nodes, { id: `no_${uid()}`, text: "", choices: [] }] })}>
        <Plus className="mr-2 h-4 w-4" />Adicionar nó
      </Button>
    </div>
  );
}
