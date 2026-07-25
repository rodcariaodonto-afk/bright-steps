import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { EngineDefinition, EngineProps } from "./types";

interface EchoConfig {
  message?: string;
}

function EchoGame({ config, emit, onFinish }: EngineProps<EchoConfig>) {
  const [clicked, setClicked] = useState(false);
  useEffect(() => {
    emit({ event_type: "start", payload: { engine: "echo" } });
  }, [emit]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-10 text-center">
      <div className="text-6xl">🧪</div>
      <h2 className="text-2xl font-bold">Motor de teste (echo)</h2>
      <p className="text-muted-foreground">{config?.message ?? "Clique no botão para finalizar."}</p>
      <Button
        size="lg"
        disabled={clicked}
        onClick={() => {
          setClicked(true);
          emit({ event_type: "answer", payload: { ok: true } });
          onFinish({ score: 1, maxScore: 1, status: "completed" });
        }}
      >
        {clicked ? "Finalizando..." : "Concluir"}
      </Button>
    </div>
  );
}

export const echoEngine: EngineDefinition<EchoConfig> = {
  code: "echo",
  name: "Echo (teste)",
  Component: EchoGame,
  listed: false,
};
