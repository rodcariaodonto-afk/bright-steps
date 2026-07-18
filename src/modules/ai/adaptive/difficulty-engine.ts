/**
 * Motor de dificuldade adaptativa.
 * Nenhum jogo/atividade tem nível fixo — todos consultam este motor.
 */

export interface AdaptiveSignals {
  timeToAnswerMs: number[]; // últimas respostas
  hits: number;
  errors: number;
  persistenceScore: number; // 0..1 (tentativas após erro)
  sessionDurationMs: number;
  timeOfDayHour: number; // 0..23
  currentLevel: number; // 1..N
}

export interface AdaptiveDecision {
  nextLevel: number;
  challengeCount: number;
  timeLimitMs: number;
  complexity: "very-simple" | "simple" | "medium" | "challenging" | "expert";
  stimulusType: "visual" | "auditory" | "mixed" | "calm";
  reason: string;
}

const COMPLEXITY_ORDER: AdaptiveDecision["complexity"][] = [
  "very-simple",
  "simple",
  "medium",
  "challenging",
  "expert",
];

export function decideNextChallenge(signals: AdaptiveSignals): AdaptiveDecision {
  const total = signals.hits + signals.errors;
  const accuracy = total > 0 ? signals.hits / total : 0.5;
  const avgTime =
    signals.timeToAnswerMs.length > 0
      ? signals.timeToAnswerMs.reduce((a, b) => a + b, 0) / signals.timeToAnswerMs.length
      : 5000;
  const tired = signals.sessionDurationMs > 20 * 60_000;
  const lateHours = signals.timeOfDayHour >= 20 || signals.timeOfDayHour < 7;

  let level = signals.currentLevel;
  let reason = "manutenção";

  if (accuracy >= 0.85 && avgTime < 4000 && !tired) {
    level = signals.currentLevel + 1;
    reason = "alta precisão e respostas rápidas";
  } else if (accuracy < 0.5 && signals.persistenceScore < 0.3) {
    level = Math.max(1, signals.currentLevel - 1);
    reason = "baixa precisão e baixa persistência, reduzindo desafio";
  } else if (tired || lateHours) {
    level = Math.max(1, signals.currentLevel - 1);
    reason = tired ? "sessão longa, descanso preventivo" : "horário tardio, modo calmo";
  }

  const complexityIndex = Math.min(
    COMPLEXITY_ORDER.length - 1,
    Math.max(0, Math.floor((level - 1) / 2)),
  );

  return {
    nextLevel: level,
    challengeCount: tired ? 3 : lateHours ? 3 : Math.min(10, 4 + Math.floor(level / 2)),
    timeLimitMs: tired ? 15_000 : Math.max(6_000, 12_000 - level * 500),
    complexity: COMPLEXITY_ORDER[complexityIndex],
    stimulusType: lateHours || tired ? "calm" : level >= 5 ? "mixed" : "visual",
    reason,
  };
}
