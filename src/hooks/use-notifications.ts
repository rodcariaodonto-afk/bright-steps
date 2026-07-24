import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/hooks/use-session";
import {
  countUnread,
  deleteNotification,
  listNotifications,
  markAllRead,
  markRead,
} from "@/modules/notifications/api";

export function useNotifications() {
  const { session } = useSession();
  return useQuery({
    queryKey: ["notifications", session?.user.id],
    queryFn: () => listNotifications(50),
    enabled: !!session?.user.id,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useUnreadCount() {
  const { session } = useSession();
  return useQuery({
    queryKey: ["notifications", "unread", session?.user.id],
    queryFn: () => countUnread(),
    enabled: !!session?.user.id,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
