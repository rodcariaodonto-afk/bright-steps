import type { AtlasMemory, MemoryKind } from "./types";

/**
 * Memória episódica — fatos-âncora que o Atlas "lembra" da criança/usuário.
 * Onda 1: in-memory, por processo. Ondas 2+: tabela `ai_memories` com RLS.
 */
const store = new Map<string, AtlasMemory[]>();

export interface RecordMemoryInput {
  subjectId: string;
  kind: MemoryKind;
  content: string;
  confidence?: number;
  source?: AtlasMemory["source"];
  expiresAt?: string;
}

export function recordMemory(input: RecordMemoryInput): AtlasMemory {
  const memory: AtlasMemory = {
    id: crypto.randomUUID(),
    subjectId: input.subjectId,
    kind: input.kind,
    content: input.content,
    confidence: input.confidence ?? 0.7,
    source: input.source ?? "ai",
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
  };
  const list = store.get(input.subjectId) ?? [];
  list.push(memory);
  store.set(input.subjectId, list);
  return memory;
}

export function listMemories(subjectId: string, kinds?: MemoryKind[]): AtlasMemory[] {
  const list = store.get(subjectId) ?? [];
  const now = Date.now();
  return list
    .filter((m) => !m.expiresAt || Date.parse(m.expiresAt) > now)
    .filter((m) => !kinds?.length || kinds.includes(m.kind))
    .sort((a, b) => b.confidence - a.confidence);
}

export function serializeMemories(memories: AtlasMemory[], limit = 20): string {
  if (!memories.length) return "";
  return memories
    .slice(0, limit)
    .map((m) => `- [${m.kind}] ${m.content}`)
    .join("\n");
}
