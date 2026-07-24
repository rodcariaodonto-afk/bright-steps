import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Check, Trash2, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações · Meu Mundo Azul" },
      {
        name: "description",
        content: "Alertas de rotinas, medicações, sessões e conquistas da família.",
      },
    ],
  }),
  component: NotificationsPage,
});

const KIND_COLORS: Record<string, string> = {
  routine: "bg-emerald-100 text-emerald-800",
  medication: "bg-red-100 text-red-800",
  appointment: "bg-sky-100 text-sky-800",
  goal: "bg-purple-100 text-purple-800",
  achievement: "bg-amber-100 text-amber-800",
  message: "bg-blue-100 text-blue-800",
  system: "bg-slate-100 text-slate-800",
};

const PRIORITY_LABEL: Record<string, string> = {
  critical: "Crítico",
  high: "Alta",
  normal: "Normal",
  low: "Baixa",
};

function NotificationsPage() {
  const { data: items = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const del = useDeleteNotification();

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="p-4 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            Notificações
          </h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0
              ? `${unread} não lida${unread > 1 ? "s" : ""} de ${items.length} recente${items.length > 1 ? "s" : ""}.`
              : "Você está em dia. Nenhuma pendente."}
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            onClick={() =>
              markAll.mutate(undefined, {
                onSuccess: () => toast.success("Todas marcadas como lidas."),
              })
            }
            disabled={markAll.isPending}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-display text-lg font-semibold">Sem notificações</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Assim que houver alertas de rotina, medicação ou sessões, eles aparecerão aqui.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const isUnread = !n.read_at;
            const created = new Date(n.created_at);
            return (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-colors",
                  isUnread && "border-primary/40 bg-primary-soft/30",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    KIND_COLORS[n.kind] ?? KIND_COLORS.system,
                  )}
                >
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{n.title}</p>
                    {n.priority !== "normal" && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        {PRIORITY_LABEL[n.priority] ?? n.priority}
                      </span>
                    )}
                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-primary" aria-label="Não lida" />
                    )}
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{created.toLocaleString("pt-BR")}</span>
                    {n.link && (
                      <Link
                        to={n.link}
                        className="font-medium text-primary hover:underline"
                      >
                        Abrir →
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isUnread && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Marcar como lida"
                      onClick={() => markRead.mutate(n.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Excluir"
                    onClick={() => del.mutate(n.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
