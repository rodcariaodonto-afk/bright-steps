import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Pill,
  CalendarDays,
  SmilePlus,
  ArrowRight,
  Baby,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useActiveChild } from "@/hooks/use-active-child";
import { PatternsCard } from "@/components/insights/patterns-card";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Painel da família · Meu Mundo Azul" },
      {
        name: "description",
        content:
          "Rotina, medicação, humor e evolução da criança em um lugar acolhedor.",
      },
    ],
  }),
  component: Dashboard,
});

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function firstName(name: string | null | undefined, fallback: string): string {
  if (!name) return fallback;
  return name.split(" ")[0];
}

function Dashboard() {
  const { profile } = useSession();
  const { activeChild, children } = useActiveChild();
  const greeting = getGreetingKey();

  const displayName = firstName(profile?.fullName, "olá");
  const childName = activeChild
    ? activeChild.nickname ?? firstName(activeChild.full_name, "sua criança")
    : null;

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Meu Mundo Azul
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-foreground md:text-4xl">
          {greeting}, {displayName}.
        </h1>
        <p className="mt-1 text-muted-foreground">
          {childName
            ? `Acompanhamento de ${childName} hoje.`
            : "Aqui está o resumo de hoje."}
        </p>
      </header>

      {children.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-5">
          {activeChild && <PatternsCard childId={activeChild.id} />}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Card
              icon={<CalendarDays className="h-5 w-5" />}
              title="Próximo compromisso"
              value="Sem agendamentos"
              hint="Cadastre a agenda em Calendário"
              tone="primary"
            />
            <Card
              icon={<Pill className="h-5 w-5" />}
              title="Medicações de hoje"
              value="Sem medicações"
              hint="Cadastre em Medicação"
              tone="accent"
            />
            <Card
              icon={<SmilePlus className="h-5 w-5" />}
              title="Humor recente"
              value="Sem registros"
              hint="Faça o primeiro em Humor"
            />

            <div className="rounded-3xl border border-dashed border-border p-6 md:col-span-2 xl:col-span-2">
              <p className="text-sm font-semibold text-muted-foreground">
                Próximo passo
              </p>
              <p className="mt-2 text-sm text-foreground">
                Registre a rotina de {childName ?? "hoje"} para começar o
                histórico.
              </p>
              <Button asChild variant="outline" className="mt-4 rounded-full">
                <Link to="/app/rotinas">
                  Ir para Rotinas
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="rounded-3xl border border-primary/20 bg-primary-soft/60 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="font-display text-base font-bold text-foreground">
                  Converse com a Azul IA
                </p>
              </div>
              <p className="mt-3 text-sm text-foreground/90">
                Tire dúvidas sobre rotina, comportamento e terapias.
              </p>
              <Button asChild variant="secondary" className="mt-4 rounded-full">
                <Link to="/app/ia">
                  Abrir chat
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-primary/30 bg-primary-soft/40 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Baby className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-6 font-display text-2xl font-bold text-foreground">
        Bem-vindo ao Meu Mundo Azul
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Comece cadastrando o perfil da sua criança. Isso destrava rotina,
        medicação, humor, jogos e conversas com a Azul IA.
      </p>
      <Button asChild size="lg" className="mt-6 rounded-full">
        <Link to="/app/crianca">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Adicionar primeira criança
        </Link>
      </Button>
    </div>
  );
}

function Card({
  icon,
  title,
  value,
  hint,
  tone = "muted",
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  hint: string;
  tone?: "primary" | "accent" | "muted";
}) {
  const iconBg =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "accent"
        ? "bg-accent text-accent-foreground"
        : "bg-surface-2 text-foreground";
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>
      <p className="mt-4 font-display text-2xl font-bold text-foreground">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
