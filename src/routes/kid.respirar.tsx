import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useActiveChild } from "@/hooks/use-active-child";
import { useKidRewards } from "@/hooks/use-kid-rewards";

export const Route = createFileRoute("/kid/respirar")({
  component: KidBreathe,
});

type Phase = "idle" | "inhale" | "hold" | "exhale" | "done";

const CYCLE: { phase: Phase; ms: number }[] = [
  { phase: "inhale", ms: 4000 },
  { phase: "hold", ms: 2000 },
  { phase: "exhale", ms: 6000 },
];
const TOTAL_CYCLES = 3;

function KidBreathe() {
  const { t } = useTranslation("kid");
  const { activeChild } = useActiveChild();
  const { addStars } = useKidRewards(activeChild?.id);
  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  function clear() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  function start() {
    clear();
    setRunning(true);
    let elapsed = 0;
    for (let c = 0; c < TOTAL_CYCLES; c++) {
      for (const step of CYCLE) {
        const at = elapsed;
        timers.current.push(
          window.setTimeout(() => setPhase(step.phase), at),
        );
        elapsed += step.ms;
      }
    }
    timers.current.push(
      window.setTimeout(() => {
        setPhase("done");
        setRunning(false);
        addStars(1);
      }, elapsed),
    );
  }

  function stop() {
    clear();
    setRunning(false);
    setPhase("idle");
  }

  const scale =
    phase === "inhale" ? 1.6 : phase === "hold" ? 1.6 : phase === "exhale" ? 0.8 : 1;
  const duration =
    phase === "inhale" ? 4 : phase === "exhale" ? 6 : phase === "hold" ? 2 : 0.5;

  const label =
    phase === "inhale"
      ? t("breathe.inhale")
      : phase === "hold"
        ? t("breathe.hold")
        : phase === "exhale"
          ? t("breathe.exhale")
          : phase === "done"
            ? t("breathe.done")
            : t("breathe.subtitle");

  return (
    <div className="space-y-8 text-center">
      <div>
        <h1 className="text-2xl font-black">{t("breathe.title")}</h1>
        <p className="mt-1 text-sm font-semibold text-[#0b2740]/70">
          {t("breathe.subtitle")}
        </p>
      </div>

      <div className="flex h-72 items-center justify-center">
        <div
          className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-blue-600 text-4xl shadow-2xl"
          style={{
            transform: `scale(${scale})`,
            transition: `transform ${duration}s ease-in-out`,
          }}
        >
          💙
        </div>
      </div>

      <div className="text-lg font-black text-[#0b2740]">{label}</div>

      <div>
        {running ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-full bg-white px-6 py-3 text-base font-black text-[#0b2740] shadow-lg"
          >
            {t("breathe.stop")}
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-[#0b6cff] px-8 py-4 text-lg font-black text-white shadow-lg hover:bg-[#0956d1]"
          >
            {t("breathe.start")}
          </button>
        )}
      </div>
    </div>
  );
}
