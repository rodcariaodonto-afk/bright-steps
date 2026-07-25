import type { ComponentType } from "react";

export type EngineCode = string;

export interface GameEventInput {
  event_type: string;
  payload?: Record<string, unknown>;
  elapsed_ms?: number;
}

export interface EngineResult {
  score: number;
  maxScore: number;
  status: "completed" | "abandoned";
  metadata?: Record<string, unknown>;
}

export interface EngineProps<TConfig = unknown> {
  config: TConfig;
  /** Emite um evento granular (buffered pelo GamePlayer). */
  emit: (event: GameEventInput) => void;
  /** Chamado pelo motor quando o jogo termina. */
  onFinish: (result: EngineResult) => void;
  /** Preferências de acessibilidade da criança ativa. */
  a11y: {
    audioEnabled: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
  };
}

export interface EngineDefinition<TConfig = unknown> {
  code: EngineCode;
  name: string;
  /** Valida um objeto config; retorna null se ok, mensagem se inválido. */
  validateConfig?: (config: unknown) => string | null;
  Component: ComponentType<EngineProps<TConfig>>;
  /** Mostrar na estante da criança? Motores internos (echo) devem retornar false. */
  listed: boolean;
}
