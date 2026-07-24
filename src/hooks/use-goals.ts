import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/modules/goals/api";

// ---- Goals ----
export function useGoals(childId: string | null | undefined) {
  return useQuery({
    queryKey: ["goals", childId],
    queryFn: () => api.listGoals(childId!),
    enabled: !!childId,
  });
}

export function useGoalProgress(goalId: string | null | undefined) {
  return useQuery({
    queryKey: ["goal-progress", goalId],
    queryFn: () => api.listGoalProgress(goalId!),
    enabled: !!goalId,
  });
}

export function useCreateGoal(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", childId] }),
  });
}

export function useUpdateGoalStatus(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: string }) =>
      api.updateGoalStatus(v.id, v.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", childId] }),
  });
}

export function useDeleteGoal(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", childId] }),
  });
}

export function useLogGoalProgress(
  childId: string | null | undefined,
  goalId: string | null | undefined,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.logGoalProgress,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goal-progress", goalId] });
      qc.invalidateQueries({ queryKey: ["goals", childId] });
    },
  });
}

// ---- Reports ----
export function useReports(childId: string | null | undefined) {
  return useQuery({
    queryKey: ["reports", childId],
    queryFn: () => api.listReports(childId!),
    enabled: !!childId,
  });
}

export function useCreateReport(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports", childId] }),
  });
}

export function useDeleteReport(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports", childId] }),
  });
}
