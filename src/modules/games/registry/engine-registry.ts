import type { EngineCode, EngineDefinition } from "../engines/types";
import { echoEngine } from "../engines/echo";
import { quizEngine } from "../engines/quiz";
import { memoryEngine } from "../engines/memory";
import { dragDropEngine } from "../engines/drag_drop";

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

registerEngine(echoEngine);
registerEngine(quizEngine);
registerEngine(memoryEngine);
registerEngine(dragDropEngine);

