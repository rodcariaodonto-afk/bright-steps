import { useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as api from "@/modules/gamification/api";

export function useKidRewards(childId: string | null | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["kid", "rewards", childId],
    queryFn: () => api.getRewards(childId!),
    enabled: !!childId,
  });

  const mutation = useMutation({
    mutationFn: (v: { delta: number; reason: string; source: string }) =>
      api.addStars(childId!, v.delta, v.reason, v.source),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kid", "rewards", childId] });
      qc.invalidateQueries({ queryKey: ["kid", "log", childId] });
    },
  });

  const addStars = useCallback(
    (delta: number, reason = "Recompensa", source = "manual") => {
      if (!childId) return;
      mutation.mutate({ delta, reason, source });
    },
    [childId, mutation],
  );

  return {
    stars: query.data?.stars ?? 0,
    lifetime: query.data?.lifetime_stars ?? 0,
    loading: query.isLoading,
    addStars,
  };
}

export function useKidAchievements(childId: string | null | undefined) {
  return useQuery({
    queryKey: ["kid", "achievements", childId],
    queryFn: () => api.listAchievements(childId!),
    enabled: !!childId,
  });
}

export function useUnlockAchievement(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.unlockAchievement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kid", "achievements", childId] });
      qc.invalidateQueries({ queryKey: ["kid", "rewards", childId] });
    },
  });
}

export function useKidRewardLog(childId: string | null | undefined) {
  return useQuery({
    queryKey: ["kid", "log", childId],
    queryFn: () => api.listRewardLog(childId!),
    enabled: !!childId,
  });
}
