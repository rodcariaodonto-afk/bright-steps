export type MemoryKind =
  | "preference" // "gosta de dinossauros"
  | "routine"    // "acorda às 7h"
  | "trigger"    // "irrita com ruído alto"
  | "goal"       // "estamos trabalhando comunicação verbal"
  | "achievement" // "conseguiu escovar sozinho pela 1ª vez"
  | "concern"    // "dorme mal desde segunda"
  | "fact";      // fato-âncora genérico

export interface AtlasMemory {
  id: string;
  subjectId: string; // childId ou userId
  kind: MemoryKind;
  content: string;
  confidence: number; // 0..1
  source: "user" | "ai" | "professional" | "system";
  createdAt: string;
  expiresAt?: string;
}
