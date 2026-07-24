import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/hooks/use-session";
import { useFamily, useChildren } from "@/hooks/use-family";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  listUnifiedEvents,
  updateCalendarEvent,
  type CalendarEventInput,
  type UnifiedEvent,
} from "@/modules/calendar/api";

export function useCalendarRange(fromISO: string, toISO: string) {
  const { data: family } = useFamily();
  const { data: children = [] } = useChildren(family?.id);
  const childIds = children.map((c) => c.id);
  return useQuery<UnifiedEvent[]>({
    queryKey: ["calendar", family?.id, childIds.join(","), fromISO, toISO],
    queryFn: () => listUnifiedEvents(family!.id, childIds, fromISO, toISO),
    enabled: !!family?.id,
    staleTime: 15_000,
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  const { session } = useSession();
  return useMutation({
    mutationFn: (input: CalendarEventInput) =>
      createCalendarEvent(input, session!.user.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar"] }),
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CalendarEventInput> }) =>
      updateCalendarEvent(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar"] }),
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar"] }),
  });
}
