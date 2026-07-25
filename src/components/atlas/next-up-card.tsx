import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { useCalendarRange } from "@/hooks/use-calendar";
import { eventColor } from "@/modules/calendar/api";

/**
 * Card "A seguir" — mostra o próximo evento (calendário ou consulta)
 * nos próximos 14 dias. Estado vazio orienta o usuário a cadastrar.
 */
export function NextUpCard() {
  const { fromISO, toISO } = useMemo(() => {
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 14);
    return { fromISO: now.toISOString(), toISO: end.toISOString() };
  }, []);

  const { data: events = [], isLoading } = useCalendarRange(fromISO, toISO);

  const next = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((e) => new Date(e.startsAt).getTime() >= now)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
  }, [events]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!next) {
    return (
      <div className="rounded-3xl border border-dashed border-primary/30 bg-primary-soft/40 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              A seguir
            </p>
            <p className="font-display text-lg font-bold text-foreground">
              Nada agendado nos próximos dias
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Cadastre consultas, terapias ou compromissos para acompanhar a rotina da criança.
        </p>
        <Link
          to="/app/calendario"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:brightness-110"
        >
          Abrir Calendário
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const date = new Date(next.startsAt);
  const dateLabel = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
  const timeLabel = next.allDay
    ? "Dia inteiro"
    : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const color = eventColor(next);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: color }}
      />
      <div className="flex items-start justify-between gap-4 pl-2">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            A seguir
          </p>
          <p className="mt-2 font-display text-xl font-extrabold text-foreground">
            {next.title}
          </p>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {dateLabel} · {timeLabel}
          </p>
          {next.location ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">📍 {next.location}</p>
          ) : null}
        </div>
        <Link
          to="/app/calendario"
          className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
        >
          Ver agenda
        </Link>
      </div>
    </div>
  );
}
