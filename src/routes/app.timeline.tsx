import { createFileRoute } from "@tanstack/react-router";
import {
  SmilePlus,
  Pill,
  Sparkles,
  ClipboardList,
} from "lucide-react";

import { useActiveChild } from "@/hooks/use-active-child";
import { useTimeline } from "@/hooks/use-care";
import { NoChildSelected } from "@/components/atlas/no-child-selected";
import type { TimelineEntry } from "@/modules/care/api";

export const Route = createFileRoute("/app/timeline")({
  head: () => ({
    meta: [
      { title: "Linha do tempo · Meu Mundo Azul" },
      {
        name: "description",
        content:
          "Histórico unificado de humor, rotinas, medicação e comportamento.",
      },
    ],
  }),
  component: TimelinePage,
});

const KIND_META: Record<TimelineEntry["kind"], { icon: React.ReactNode; color: string; label: string }> = {
  mood: {
    icon: <SmilePlus className="h-4 w-4" />,
    color: "bg-accent/40 text-accent-foreground",
    label: "Humor",
  },
  medication: {
    icon: <Pill className="h-4 w-4" />,
    color: "bg-primary-soft text-primary",
    label: "Medicação",
  },
  behavior: {
    icon: <Sparkles className="h-4 w-4" />,
    color: "bg-secondary text-secondary-foreground",
    label: "Comportamento",
  },
  routine: {
    icon: <ClipboardList className="h-4 w-4" />,
    color: "bg-muted text-foreground",
    label: "Rotina",
  },
};

function TimelinePage() {
  const { activeChild } = useActiveChild();
  const { data: entries = [], isLoading } = useTimeline(activeChild?.id);

  if (!activeChild) return <NoChildSelected />;

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
          Linha do tempo
        </h1>
        <p className="text-sm text-muted-foreground">
          Tudo o que aconteceu com {activeChild.nickname ?? activeChild.full_name.split(" ")[0]}.
        </p>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : entries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Ainda não há registros. Comece pelo Humor ou Rotinas.
          </p>
        </div>
      ) : (
        <ol className="relative border-l-2 border-border/60 pl-6">
          {entries.map((e) => {
            const meta = KIND_META[e.kind];
            return (
              <li key={e.id} className="mb-6">
                <span
                  className={`absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full ${meta.color}`}
                >
                  {meta.icon}
                </span>
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {meta.label}
                    </p>
                    <time className="text-xs text-muted-foreground">
                      {new Date(e.at).toLocaleString("pt-BR")}
                    </time>
                  </div>
                  <p className="mt-1 font-medium text-foreground">{e.title}</p>
                  {e.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {e.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
