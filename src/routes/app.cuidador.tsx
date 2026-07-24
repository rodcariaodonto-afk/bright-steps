import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { HeartHandshake, Moon, Wind, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/atlas/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { logCaregiverMood, listCaregiverMood } from "@/modules/assessments/api.functions";
import { listLibraryArticles } from "@/modules/library/api.functions";

const MOODS = [
  { v: 1, e: "😞", l: "Muito difícil" },
  { v: 2, e: "😕", l: "Cansado" },
  { v: 3, e: "😐", l: "Neutro" },
  { v: 4, e: "🙂", l: "Bem" },
  { v: 5, e: "😊", l: "Ótimo" },
];

export const Route = createFileRoute("/app/cuidador")({
  head: () => ({
    meta: [
      { title: "Bem estar do cuidador | Meu Mundo Azul" },
      { name: "description", content: "Autocuidado, check in de humor e conteúdos para quem cuida." },
    ],
  }),
  component: CaregiverPage,
});

function CaregiverPage() {
  const qc = useQueryClient();
  const logFn = useServerFn(logCaregiverMood);
  const listFn = useServerFn(listCaregiverMood);
  const artsFn = useServerFn(listLibraryArticles);

  const [mood, setMood] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [sleep, setSleep] = useState("");
  const [note, setNote] = useState("");

  const { data: history = [] } = useQuery({ queryKey: ["caregiver-mood"], queryFn: () => listFn() });
  const { data: articles = [] } = useQuery({
    queryKey: ["caregiver-articles"],
    queryFn: () => artsFn({ data: { categorySlug: "cuidador" } }),
  });

  const save = useMutation({
    mutationFn: () =>
      logFn({
        data: {
          mood: mood!,
          stress: stress ?? undefined,
          sleep_hours: sleep ? Number(sleep) : undefined,
          note: note || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Check in registrado, cuide de você!");
      setMood(null); setStress(null); setSleep(""); setNote("");
      qc.invalidateQueries({ queryKey: ["caregiver-mood"] });
    },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-rose-600">
            <HeartHandshake className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Bem estar do cuidador</span>
          </div>
          <h1 className="text-3xl font-semibold">Cuidar de quem cuida</h1>
          <p className="text-muted-foreground max-w-2xl">
            Um espaço só seu. Registre como está, respire e acesse conteúdos de apoio.
          </p>
        </header>

        <Card>
          <CardContent className="p-5 space-y-5">
            <div>
              <p className="text-sm font-medium mb-2">Como você está hoje?</p>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.v}
                    onClick={() => setMood(m.v)}
                    className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition ${
                      mood === m.v ? "bg-rose-50 border-rose-400 dark:bg-rose-900/20" : "border-border hover:bg-muted"
                    }`}
                  >
                    <span className="text-2xl">{m.e}</span>
                    <span className="text-xs text-muted-foreground">{m.l}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Nível de estresse (1 baixo, 5 alto)</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => setStress(v)}
                    className={`w-10 h-10 rounded-md border text-sm font-semibold transition ${
                      stress === v ? "bg-brand-primary text-white border-brand-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium block mb-1">Horas de sono</label>
                <Input type="number" step="0.5" min="0" max="24" value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="Ex.: 6.5" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Como se sente? (opcional)</label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Um espaço para desabafar." />
            </div>

            <Button onClick={() => save.mutate()} disabled={!mood || save.isPending}>
              {save.isPending ? "Salvando..." : "Registrar check in"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/kid/respirar">
            <Card className="h-full hover:border-brand-primary/40 transition">
              <CardContent className="p-5 space-y-2">
                <Wind className="h-6 w-6 text-brand-primary" />
                <p className="font-semibold">Respire 1 minuto</p>
                <p className="text-sm text-muted-foreground">Exercício guiado para reduzir a ansiedade.</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/app/autoavaliacoes/$slug" params={{ slug: "sobrecarga-cuidador" }}>
            <Card className="h-full hover:border-brand-primary/40 transition">
              <CardContent className="p-5 space-y-2">
                <Moon className="h-6 w-6 text-brand-primary" />
                <p className="font-semibold">Escala de sobrecarga</p>
                <p className="text-sm text-muted-foreground">Responda 6 perguntas rápidas.</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/app/biblioteca">
            <Card className="h-full hover:border-brand-primary/40 transition">
              <CardContent className="p-5 space-y-2">
                <BookOpen className="h-6 w-6 text-brand-primary" />
                <p className="font-semibold">Biblioteca</p>
                <p className="text-sm text-muted-foreground">Conteúdos de bem estar e autocuidado.</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {articles.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Leituras recomendadas</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {articles.slice(0, 4).map((a) => (
                <Link key={a.id} to="/app/biblioteca/$slug" params={{ slug: a.slug }}>
                  <Card className="h-full hover:border-brand-primary/40 transition">
                    <CardContent className="p-4">
                      <p className="font-medium">{a.title}</p>
                      {a.summary && <p className="text-sm text-muted-foreground line-clamp-2">{a.summary}</p>}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Seu histórico</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Registre seu primeiro check in acima.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {history.slice(0, 10).map((h) => (
                <Card key={h.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-2xl">{MOODS.find((m) => m.v === h.mood)?.e ?? "🙂"}</span>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{new Date(h.logged_at).toLocaleString("pt-BR")}</p>
                      {h.note && <p className="text-sm line-clamp-2">{h.note}</p>}
                    </div>
                    {h.stress && <span className="text-xs text-muted-foreground">Estresse: {h.stress}</span>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
