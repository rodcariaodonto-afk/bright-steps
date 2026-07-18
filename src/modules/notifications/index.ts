export type NotificationChannel = "in_app" | "email" | "push" | "sms";

export type NotificationPriority = "critical" | "high" | "normal" | "low";

export interface Notification {
  id: string;
  userId: string;
  kind:
    | "routine"
    | "medication"
    | "appointment"
    | "goal"
    | "achievement"
    | "marketplace"
    | "message"
    | "system";
  title: string;
  body: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  scheduledFor?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPreference {
  userId: string;
  channel: NotificationChannel;
  kinds: Notification["kind"][];
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string;
}

/**
 * Motor de priorização. Onda 4 conecta IA para decidir "vale notificar agora?".
 * Regra base: quiet hours suprimem tudo exceto critical.
 */
export function shouldDeliverNow(
  n: Notification,
  pref: NotificationPreference,
  now: Date = new Date(),
): boolean {
  if (n.priority === "critical") return true;
  if (!pref.quietHoursStart || !pref.quietHoursEnd) return true;
  const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const inQuiet =
    pref.quietHoursStart <= pref.quietHoursEnd
      ? hm >= pref.quietHoursStart && hm < pref.quietHoursEnd
      : hm >= pref.quietHoursStart || hm < pref.quietHoursEnd;
  return !inQuiet;
}
