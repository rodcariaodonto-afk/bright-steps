import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, MapPin, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFamily, useChildren } from "@/hooks/use-family";
import {
  useCalendarRange,
  useCreateCalendarEvent,
  useDeleteCalendarEvent,
} from "@/hooks/use-calendar";
import { eventColor, type UnifiedEvent } from "@/modules/calendar/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário · Meu Mundo Azul" },
      {
        name: "description",
        content: "Agenda unificada da família: sessões clínicas, escola, medicações e compromissos.",
      },
    ],
  }),
  component: CalendarPage,
});

const CATEGORIES: { value: string; label: string }[] = [
  { value: "general", label: "Geral" },
  { value: "therapy", label: "Terapia" },
  { value: "medical", label: "Consulta médica" },
  { value: "school", label: "Escola" },
  { value: "family", label: "Família" },
  { value: "other", label: "Outro" },
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function toLocalDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CalendarPage() {
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));
  const [openNew, setOpenNew] = useState(false);
  const { data: family } = useFamily();
  const { data: children = [] } = useChildren(family?.id);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));

  const { data: events = [], isLoading } = useCalendarRange(
    gridStart.toISOString(),
    gridEnd.toISOString(),
  );

  const days = useMemo(() => {
    const arr: Date[] = [];
    const cur = new Date(gridStart);
    while (cur <= gridEnd) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, [gridStart, gridEnd]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, UnifiedEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.startsAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const [selected, setSelected] = useState<Date>(new Date());
  const selectedKey = `${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}`;
  const selectedEvents = eventsByDay.get(selectedKey) ?? [];

  const monthLabel = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="p-4 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            Calendário
          </h1>
          <p className="text-sm text-muted-foreground">
            Sessões, medicações, escola e compromissos da família em um só lugar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Mês anterior"
            onClick={() => setCursor(addMonths(cursor, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[10rem] text-center text-sm font-semibold capitalize">
            {monthLabel}
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Próximo mês"
            onClick={() => setCursor(addMonths(cursor, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const t = new Date();
              setCursor(startOfMonth(t));
              setSelected(t);
            }}
          >
            Hoje
          </Button>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <Plus className="mr-1.5 h-4 w-4" /> Novo evento
              </Button>
            </DialogTrigger>
            <NewEventDialog
              defaultDate={selected}
              familyId={family?.id}
              children={children.map((c) => ({ id: c.id, name: c.full_name }))}
              onDone={() => setOpenNew(false)}
            />
          </Dialog>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* MONTH GRID */}
        <div className="rounded-2xl border border-border/60 bg-card p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-muted-foreground">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
              const dayEvents = eventsByDay.get(key) ?? [];
              const isCurrentMonth = day.getMonth() === cursor.getMonth();
              const isToday = sameDay(day, new Date());
              const isSelected = sameDay(day, selected);
              return (
                <button
                  key={key}
                  onClick={() => setSelected(day)}
                  className={cn(
                    "flex min-h-[84px] flex-col items-start rounded-lg border p-1.5 text-left transition-colors",
                    isCurrentMonth ? "bg-background" : "bg-muted/40 text-muted-foreground",
                    isSelected ? "border-primary ring-2 ring-primary/40" : "border-border/60",
                  )}
                >
                  <span
                    className={cn(
                      "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isToday && "bg-primary text-primary-foreground",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <div className="flex w-full flex-col gap-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: eventColor(ev) }}
                      >
                        <span className="truncate">{ev.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3} mais
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {isLoading && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Carregando eventos…
            </p>
          )}
        </div>

        {/* DAY DETAIL */}
        <aside className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold capitalize">
              {selected.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </h2>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum compromisso neste dia.
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((ev) => (
                <EventCard key={ev.id} ev={ev} />
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function EventCard({ ev }: { ev: UnifiedEvent }) {
  const del = useDeleteCalendarEvent();
  const start = new Date(ev.startsAt);
  const end = new Date(ev.endsAt);
  const time = ev.allDay
    ? "Dia inteiro"
    : `${start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}${
        end ? ` – ${end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""
      }`;

  const canDelete = ev.source === "event";
  const rawId = ev.id.split(":")[1];

  return (
    <li
      className="rounded-xl border border-border/60 bg-background p-3"
      style={{ borderLeft: `4px solid ${eventColor(ev)}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{ev.title}</p>
          <p className="text-xs text-muted-foreground">{time}</p>
          {ev.location && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {ev.location}
            </p>
          )}
          {ev.description && (
            <p className="mt-1 text-xs text-foreground/80">{ev.description}</p>
          )}
          <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
            {ev.source === "appointment" ? "Sessão clínica" : ev.category ?? "evento"}
          </span>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir"
            onClick={() => {
              if (confirm("Excluir este evento?")) {
                del.mutate(rawId, {
                  onSuccess: () => toast.success("Evento excluído."),
                  onError: (e) => toast.error((e as Error).message),
                });
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </li>
  );
}

function NewEventDialog({
  defaultDate,
  familyId,
  children,
  onDone,
}: {
  defaultDate: Date;
  familyId: string | undefined;
  children: { id: string; name: string }[];
  onDone: () => void;
}) {
  const create = useCreateCalendarEvent();
  const start = new Date(defaultDate);
  start.setHours(9, 0, 0, 0);
  const end = new Date(defaultDate);
  end.setHours(10, 0, 0, 0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [startsAt, setStartsAt] = useState(toLocalDateInput(start));
  const [endsAt, setEndsAt] = useState(toLocalDateInput(end));
  const [location, setLocation] = useState("");
  const [childId, setChildId] = useState<string>("none");
  const [allDay, setAllDay] = useState(false);

  const submit = () => {
    if (!familyId) return toast.error("Família não carregada.");
    if (!title.trim()) return toast.error("Informe um título.");
    create.mutate(
      {
        family_id: familyId,
        child_id: childId === "none" ? null : childId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        all_day: allDay,
        location: location.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Evento criado.");
          onDone();
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Novo evento</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label htmlFor="ev-title">Título</Label>
          <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ev-cat">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="ev-cat"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="ev-child">Criança (opcional)</Label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger id="ev-child"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Nenhuma —</SelectItem>
                {children.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ev-start">Início</Label>
            <Input
              id="ev-start"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ev-end">Fim</Label>
            <Input
              id="ev-end"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            id="ev-allday"
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          <Label htmlFor="ev-allday" className="cursor-pointer">Dia inteiro</Label>
        </div>
        <div>
          <Label htmlFor="ev-loc">Local (opcional)</Label>
          <Input id="ev-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ev-desc">Descrição (opcional)</Label>
          <Textarea
            id="ev-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>Cancelar</Button>
        <Button onClick={submit} disabled={create.isPending}>
          {create.isPending ? "Criando…" : "Criar evento"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
