/**
 * Sistema de gamificação. Moeda virtual, conquistas ilimitadas, missões, eventos sazonais.
 * A moeda NUNCA tem valor financeiro real.
 */

export interface VirtualCurrency {
  code: string;
  displayName: string;
  icon: string;
}

export const DEFAULT_CURRENCY: VirtualCurrency = {
  code: "STARS",
  displayName: "Estrelas",
  icon: "⭐",
};

export type AchievementCategory =
  | "communication"
  | "reading"
  | "math"
  | "social"
  | "autonomy"
  | "routine"
  | "emotions"
  | "creativity"
  | "coordination"
  | "persistence"
  | "coexistence";

export interface Achievement {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  reward: number; // moeda virtual
  icon: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  expiresAt?: string;
  eventId?: string;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  themeColor: string;
  icon: string;
}

// Onda 3: substituir por queries reais.
export const SEED_ACHIEVEMENTS: Achievement[] = [
  { id: "ach-1", category: "routine", title: "Primeira rotina completa", description: "Cumpriu toda a rotina do dia.", reward: 5, icon: "🌅" },
  { id: "ach-2", category: "emotions", title: "Nomeei um sentimento", description: "Identificou uma emoção sozinho.", reward: 3, icon: "💛" },
  { id: "ach-3", category: "communication", title: "Contei uma novidade", description: "Compartilhou algo do dia.", reward: 4, icon: "💬" },
];

export const SEED_EVENTS: SeasonalEvent[] = [
  { id: "ev-christmas", name: "Natal Encantado", startsAt: "2026-12-01", endsAt: "2026-12-31", themeColor: "#B91C1C", icon: "🎄" },
  { id: "ev-easter", name: "Páscoa Colorida", startsAt: "2027-04-01", endsAt: "2027-04-15", themeColor: "#EAB308", icon: "🐰" },
  { id: "ev-childrens", name: "Dia das Crianças", startsAt: "2026-10-05", endsAt: "2026-10-12", themeColor: "#DB2777", icon: "🎈" },
];
