import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/hooks/use-session";
import {
  ensureFamily,
  listChildren,
  listMembers,
  createChild,
  updateChild,
  softDeleteChild,
  inviteMember,
  removeMember,
  updateFamily,
  type ChildInput,
  type FamilyRole,
} from "@/modules/family/api";

export function useFamily() {
  const { session, profile } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["family", userId],
    queryFn: () => ensureFamily(userId!, profile?.fullName ?? profile?.email ?? null),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useChildren(familyId: string | undefined) {
  return useQuery({
    queryKey: ["children", familyId],
    queryFn: () => listChildren(familyId!),
    enabled: !!familyId,
    staleTime: 30_000,
  });
}

export function useFamilyMembers(familyId: string | undefined) {
  return useQuery({
    queryKey: ["family-members", familyId],
    queryFn: () => listMembers(familyId!),
    enabled: !!familyId,
    staleTime: 30_000,
  });
}

export function useCreateChild(familyId: string | undefined) {
  const qc = useQueryClient();
  const { session } = useSession();
  return useMutation({
    mutationFn: (input: ChildInput) => createChild(familyId!, session!.user.id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["children", familyId] }),
  });
}

export function useUpdateChild(familyId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ChildInput> }) =>
      updateChild(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["children", familyId] }),
  });
}

export function useDeleteChild(familyId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteChild(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["children", familyId] }),
  });
}

export function useUpdateFamily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; timezone?: string } }) =>
      updateFamily(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["family"] }),
  });
}

export function useInviteMember(familyId: string | undefined) {
  const qc = useQueryClient();
  const { session } = useSession();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: FamilyRole }) =>
      inviteMember(familyId!, email, role, session!.user.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["family-members", familyId] }),
  });
}

export function useRemoveMember(familyId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeMember(memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["family-members", familyId] }),
  });
}
