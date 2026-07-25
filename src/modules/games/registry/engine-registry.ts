import type { EngineCode, EngineDefinition } from "../engines/types";
import { echoEngine } from "../engines/echo";

const registry = new Map<EngineCode, EngineDefinition<any>>();

export function registerEngine(engine: EngineDefinition<any>) {
  registry.set(engine.code, engine);
}

export function getEngine(code: EngineCode): EngineDefinition<any> | undefined {
  return registry.get(code);
}

export function listEngines(): EngineDefinition<any>[] {
  return Array.from(registry.values());
}

// Registrar motores conhecidos. Sprint 2 adiciona quiz/memory/drag_drop aqui.
registerEngine(echoEngine);
