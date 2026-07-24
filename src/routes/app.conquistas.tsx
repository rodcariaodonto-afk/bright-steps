import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Star, Sparkles } from "lucide-react";

import { useActiveChild } from "@/hooks/use-active-child";
import { NoChildSelected } from "@/components/atlas/no-child-selected";
import {
  useKidRewards,
  useKidAchievements,
  useKidRewardLog,
  useUnlockAchievement,
} from "@/hooks/use-kid-rewards";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/app/conquistas")({
  head: () => ({
    meta: [
      { title: "Conquistas · Meu Mundo Azul" },
      {
        name: "description",
        content:
          "Estrelinhas, conquistas e evolução lúdica da criança em um só lugar.",
      },
    ],
  }),
  component: AchievementsPage,
});

const CATALOG = [
  {
    code: "first_mood",
    title: "Primeiro check-in de humor",
    description: "Registrou como se sente pela primeira vez.",
    icon: "🌈",
    category: "emotions",
    stars: 3,
  },
  {
    code: "breathe_5",
    title: "Fôlego de campeão",
    description: "Completou 5 ciclos de respiração.",
    icon: "🌬️",
    category: "autonomy",
    stars: 5,
  },
  {
    code: "story_teller",
    title: "Contador de histórias",
    description: "Criou uma história personalizada com a Azul.",
    icon: "📖",
    category: "creativity",
    stars: 5,
  },
  {
    code: "routine_hero",
    title: "Herói da rotina",
    description: "Completou todas as rotinas de um dia.",
    icon: "⏰",
    category: "routine",
    stars: 10,
  },
];

function AchievementsPage() {
  const { activeChild } = useActiveChild();
  const { stars, lifetime } = useKidRewards(activeChild?.id);
  const { data: achievements = [] } = useKidAchievements(activeChild?.id);
  const { data: log = [] } = useKidRewardLog(activeChild?.id);
  const unlock = useUnlockAchievement(activeChild?.id);

  if (!activeChild) return <NoChildSelected />;

  const unlockedCodes = new Set(achievements.map((a) => a.code));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">
          Conquistas de {activeChild.full_name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe estrelinhas, medalhas e evolução lúdica.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-amber-300 to-orange-500 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
              Estrelinhas agora
            </p>
          </div>
          <p className="mt-3 text-4xl font-black">{stars}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-wider">
              Total conquistado
            </p>
          </div>
          <p className="mt-3 text-4xl font-black text-foreground">{lifetime}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-wider">
              Medalhas
            </p>
          </div>
          <p className="mt-3 text-4xl font-black text-foreground">
            {achievements.length}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Catálogo</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {CATALOG.map((a) => {
            const unlocked = unlockedCodes.has(a.code);
            return (
              <div
                key={a.code}
                className={`flex items-start gap-3 rounded-xl border p-4 ${
                  unlocked
                    ? "border-primary/40 bg-primary-soft/30"
                    : "border-border/60 bg-background"
                }`}
              >
                <div className="text-3xl">{a.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <span className="text-xs font-bold text-amber-600">
                      +{a.stars} ⭐
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.description}
                  </p>
                  {unlocked ? (
                    <p className="mt-2 text-xs font-semibold text-primary">
                      Desbloqueada ✓
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 text-xs"
                      onClick={() =>
                        unlock.mutate(
                          {
                            child_id: activeChild.id,
                            code: a.code,
                            title: a.title,
                            description: a.description,
                            icon: a.icon,
                            category: a.category,
                            stars_earned: a.stars,
                          },
                          {
                            onSuccess: () =>
                              toast.success(`Conquista desbloqueada: ${a.title}`),
                            onError: (e) => toast.error((e as Error).message),
                          },
                        )
                      }
                    >
                      Desbloquear manualmente
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Últimos ganhos
        </h2>
        {log.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum ganho registrado ainda. Peça para a criança abrir o Mundo Azul!
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {log.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {l.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleString("pt-BR")} · {l.source}
                  </p>
                </div>
                <span
                  className={`font-bold ${l.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {l.delta >= 0 ? "+" : ""}
                  {l.delta} ⭐
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
