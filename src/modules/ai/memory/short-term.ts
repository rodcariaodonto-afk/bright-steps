import type { PersonaId } from "../personas";

/**
 * Memória de curto prazo — janela da conversa atual.
 * Onda 1: sessionStorage (por aba, por persona).
 * Onda 2: hidratada do banco no login e sincronizada a cada mensagem.
 */

const KEY_PREFIX = "atlas.chat.";

export interface ChatSnapshot {
  persona: PersonaId;
  childId?: string;
  updatedAt: string;
  messages: Array<{ role: "user" | "assistant"; text: string }>;
}

function key(persona: PersonaId, childId?: string) {
  return `${KEY_PREFIX}${persona}${childId ? `.${childId}` : ""}`;
}

export function loadSnapshot(persona: PersonaId, childId?: string): ChatSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key(persona, childId));
    return raw ? (JSON.parse(raw) as ChatSnapshot) : null;
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot: ChatSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      key(snapshot.persona, snapshot.childId),
      JSON.stringify(snapshot),
    );
  } catch {
    // storage cheio ou modo privado — ignora silenciosamente
  }
}

export function clearSnapshot(persona: PersonaId, childId?: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key(persona, childId));
}
