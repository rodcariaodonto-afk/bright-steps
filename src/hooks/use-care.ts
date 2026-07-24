import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as api from "@/modules/care/api";

// ---- Routines ----
export function useRoutines(childId: string | null | undefined) {
  return useQuery({
    queryKey: ["care", "routines", childId],
    queryFn: () => api.listRoutines(childId!),
    enabled: !!childId,
  });
}

export function useCompletionsToday(childId: string | null | undefined) {
  const today = new Date().toISOString().slice(0, 10);
  return useQuery({
    queryKey: ["care", "completions", childId, today],
    queryFn: () => api.listCompletionsForDate(childId!, today),
    enabled: !!childId,
  });
}

export function useCreateRoutine(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createRoutine,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care", "routines", childId] });
    },
  });
}

export function useToggleRoutine(childId: string | null | undefined) {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  return useMutation({
    mutationFn: (v: { routine: api.Routine; done: boolean }) =>
      api.toggleRoutineCompletion(v.routine, today, v.done),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care", "completions", childId, today] });
      qc.invalidateQueries({ queryKey: ["care", "timeline", childId] });
    },
  });
}

export function useArchiveRoutine(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.archiveRoutine,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["care", "routines", childId] }),
  });
}

// ---- Medications ----
export function useMedications(childId: string | null | undefined) {
  return useQuery({
    queryKey: ["care", "meds", childId],
    queryFn: () => api.listMedications(childId!),
    enabled: !!childId,
  });
}

export function useMedicationLogs(childId: string | null | undefined) {
  return useQuery({
    queryKey: ["care", "medlogs", childId],
    queryFn: () => api.recentMedicationLogs(childId!),
    enabled: !!childId,
  });
}

export function useCreateMedication(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createMedication,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["care", "meds", childId] }),
  });
}

export function useArchiveMedication(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.archiveMedication,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["care", "meds", childId] }),
  });
}

export function useLogMedication(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.logMedication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care", "medlogs", childId] });
      qc.invalidateQueries({ queryKey: ["care", "timeline", childId] });
    },
  });
}

// ---- Mood ----
export function useMoodLogs(childId: string | null | undefined) {
  return useQuery({
    queryKey: ["care", "mood", childId],
    queryFn: () => api.listMoodLogs(childId!),
    enabled: !!childId,
  });
}

export function useCreateMood(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createMoodLog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care", "mood", childId] });
      qc.invalidateQueries({ queryKey: ["care", "timeline", childId] });
    },
  });
}

// ---- Behavior ----
export function useBehaviorEvents(childId: string | null | undefined) {
  return useQuery({
    queryKey: ["care", "behavior", childId],
    queryFn: () => api.listBehaviorEvents(childId!),
    enabled: !!childId,
  });
}

export function useCreateBehavior(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createBehaviorEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care", "behavior", childId] });
      qc.invalidateQueries({ queryKey: ["care", "timeline", childId] });
    },
  });
}

// ---- Timeline ----
export function useTimeline(childId: string | null | undefined) {
  return useQuery({
    queryKey: ["care", "timeline", childId],
    queryFn: () => api.loadTimeline(childId!),
    enabled: !!childId,
  });
}
