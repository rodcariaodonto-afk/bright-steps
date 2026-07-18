import type { InterestTheme } from "../personalization/interest-engine";

/**
 * Motor de recomendação. Onda 1: heurística baseada em interesse dominante.
 * Onda 3: reranking por histórico real + IA.
 */
export type RecommendationKind =
  | "story"
  | "game"
  | "activity"
  | "book"
  | "reward"
  | "goal"
  | "routine";

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  title: string;
  reason: string;
}

const CATALOG: Record<InterestTheme, Recommendation[]> = {
  dinosaurs: [
    { id: "rec-dino-1", kind: "story", title: "Rex e o ovo perdido", reason: "história curta sobre paciência" },
    { id: "rec-dino-2", kind: "game", title: "Caça aos fósseis", reason: "atenção sustentada" },
    { id: "rec-dino-3", kind: "activity", title: "Escavação de areia cinética", reason: "regulação sensorial" },
  ],
  space: [
    { id: "rec-space-1", kind: "story", title: "Nova visita a Lua", reason: "sequência previsível" },
    { id: "rec-space-2", kind: "game", title: "Constelações", reason: "reconhecimento de padrão" },
  ],
  princesses: [
    { id: "rec-prin-1", kind: "story", title: "Aurora enfrenta o dragão da timidez", reason: "história social" },
  ],
  cars: [
    { id: "rec-car-1", kind: "game", title: "Corrida das cores", reason: "reação e categorização" },
  ],
  animals: [
    { id: "rec-anim-1", kind: "story", title: "Mila e o amigo diferente", reason: "empatia" },
  ],
  superheroes: [
    { id: "rec-hero-1", kind: "activity", title: "Missão do dia", reason: "gamificação de rotina" },
  ],
  ocean: [
    { id: "rec-oc-1", kind: "story", title: "Coral e a onda gigante", reason: "regulação emocional" },
  ],
  music: [
    { id: "rec-mus-1", kind: "activity", title: "Ritmo do humor", reason: "expressão emocional" },
  ],
  sports: [
    { id: "rec-sp-1", kind: "activity", title: "Circuito de coordenação", reason: "planejamento motor" },
  ],
  art: [
    { id: "rec-art-1", kind: "activity", title: "Desenho do sentimento", reason: "identificar emoções" },
  ],
  neutral: [
    { id: "rec-n-1", kind: "story", title: "Um dia com Atlas", reason: "acolhimento inicial" },
  ],
};

export function recommendForChild(theme: InterestTheme, limit = 5): Recommendation[] {
  const list = CATALOG[theme] ?? CATALOG.neutral;
  return list.slice(0, limit);
}
