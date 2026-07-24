import { useCallback, useEffect, useState } from "react";

const KEY = "mma:kid-rewards";

type Rewards = { stars: number; updatedAt: string };

function read(childId: string | null | undefined): Rewards {
  if (typeof window === "undefined" || !childId) {
    return { stars: 0, updatedAt: new Date().toISOString() };
  }
  try {
    const raw = window.localStorage.getItem(`${KEY}:${childId}`);
    if (!raw) return { stars: 0, updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as Rewards;
  } catch {
    return { stars: 0, updatedAt: new Date().toISOString() };
  }
}

function write(childId: string, value: Rewards) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${KEY}:${childId}`, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("mma:kid-rewards-updated"));
}

/**
 * Estrelinhas (moeda virtual da criança). Client-side, por criança ativa.
 * Simples por ora; migrável para tabela `kid_rewards` no backend.
 */
export function useKidRewards(childId: string | null | undefined) {
  const [rewards, setRewards] = useState<Rewards>(() => read(childId));

  useEffect(() => {
    setRewards(read(childId));
    const onUpd = () => setRewards(read(childId));
    window.addEventListener("mma:kid-rewards-updated", onUpd);
    return () => window.removeEventListener("mma:kid-rewards-updated", onUpd);
  }, [childId]);

  const addStars = useCallback(
    (n: number) => {
      if (!childId) return;
      const current = read(childId);
      const next: Rewards = {
        stars: Math.max(0, current.stars + n),
        updatedAt: new Date().toISOString(),
      };
      write(childId, next);
      setRewards(next);
    },
    [childId],
  );

  return { stars: rewards.stars, addStars };
}
