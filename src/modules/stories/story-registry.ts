import { LinearStory } from "./engines/linear";
import { BranchingStory } from "./engines/branching";
import type { StoryEngineDefinition, StoryType } from "./types";

export const STORY_ENGINES: Record<StoryType, StoryEngineDefinition> = {
  linear: {
    code: "linear",
    label: "Linear ilustrada",
    description: "Sequência de páginas com emoji/imagem e texto. Ideal para rotinas e narrativas simples.",
    defaultConfig: {
      pages: [
        { emoji: "🌟", text: "Era uma vez..." },
        { emoji: "🎈", text: "Continue a história aqui." },
      ],
    },
    Component: LinearStory,
  },
  branching: {
    code: "branching",
    label: "Ramificada (com escolhas)",
    description: "Nós conectados por escolhas; permite múltiplos finais.",
    defaultConfig: {
      startId: "inicio",
      nodes: [
        {
          id: "inicio",
          emoji: "✨",
          text: "Comece a história aqui. O que fazer?",
          choices: [
            { label: "Caminho A", next: "final_a", reward: 1 },
            { label: "Caminho B", next: "final_b", reward: 1 },
          ],
        },
        { id: "final_a", emoji: "🎉", text: "Final A!", ending: true },
        { id: "final_b", emoji: "🌈", text: "Final B!", ending: true },
      ],
    },
    Component: BranchingStory,
  },
};

export function getStoryEngine(code: string) {
  return STORY_ENGINES[code as StoryType];
}
