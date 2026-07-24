import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as api from "@/modules/school/api";

export function useSchools(childId: string | null | undefined) {
  return useQuery({
    queryKey: ["school", "profiles", childId],
    queryFn: () => api.listSchools(childId!),
    enabled: !!childId,
  });
}

export function useCreateSchool(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createSchool,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["school", "profiles", childId] }),
  });
}

export function useDeleteSchool(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteSchool,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["school", "profiles", childId] }),
  });
}

export function useSchoolNotes(
  childId: string | null | undefined,
  schoolId?: string | null,
) {
  return useQuery({
    queryKey: ["school", "notes", childId, schoolId ?? "all"],
    queryFn: () => api.listNotes(childId!, schoolId ?? null),
    enabled: !!childId,
  });
}

export function useCreateSchoolNote(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createNote,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["school", "notes", childId] }),
  });
}

export function useTogglePinNote(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; pinned: boolean }) =>
      api.togglePinNote(v.id, v.pinned),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["school", "notes", childId] }),
  });
}

export function useDeleteSchoolNote(childId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteNote,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["school", "notes", childId] }),
  });
}
