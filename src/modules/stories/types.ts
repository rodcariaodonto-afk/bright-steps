export type StoryType = "linear" | "branching";

export interface StoryRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_url: string | null;
  story_type: StoryType;
  config: unknown;
  stars_reward: number | null;
  age_min: number | null;
  age_max: number | null;
  tags: string[] | null;
  published: boolean | null;
}

/** ---- Linear ---- */
export interface LinearPage {
  emoji?: string;
  imageUrl?: string;
  text: string;
}
export interface LinearConfig {
  pages: LinearPage[];
}

/** ---- Branching ---- */
export interface BranchingChoice {
  label: string;
  next: string;
  reward?: number;
}
export interface BranchingNode {
  id: string;
  text: string;
  emoji?: string;
  imageUrl?: string;
  choices?: BranchingChoice[];
  ending?: boolean;
}
export interface BranchingConfig {
  startId: string;
  nodes: BranchingNode[];
}

export interface StoryEngineProps<C> {
  config: C;
  onFinish: (result: { completed: boolean; visited?: string[]; reward?: number }) => void;
}

export interface StoryEngineDefinition {
  code: StoryType;
  label: string;
  description: string;
  defaultConfig: unknown;
  Component: React.ComponentType<StoryEngineProps<any>>;
}
