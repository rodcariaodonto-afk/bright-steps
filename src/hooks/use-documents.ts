import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  type ChildDocument,
} from "@/modules/documents/api";

export function useDocuments(childId: string | null) {
  return useQuery({
    queryKey: ["documents", childId],
    queryFn: () => listDocuments(childId!),
    enabled: !!childId,
  });
}

export function useUploadDocument(childId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof uploadDocument>[0]) => uploadDocument(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents", childId] }),
  });
}

export function useDeleteDocument(childId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (doc: ChildDocument) => deleteDocument(doc),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents", childId] }),
  });
}
