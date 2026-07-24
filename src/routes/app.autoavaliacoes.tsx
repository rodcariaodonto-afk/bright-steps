import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardCheck, History } from "lucide-react";
import { AppShell } from "@/components/atlas/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAssessments, listMyResponses } from "@/modules/assessments/api.functions";

export const Route = createFileRoute("/app/autoavaliacoes")({
  head: () => ({
    meta: [
      { title: "Autoavaliações | Meu Mundo Azul" },
      { name: "description", content: "Instrumentos educativos: M-CHAT-R, sono, sobrecarga do cuidador e marcos de rotina." },
    ],
  }),
  component: SelfAssessmentsPage,
});

function SelfAssessmentsPage() {
  const listFn = useServerFn(listAssessments);
  const historyFn = useServerFn(listMyResponses);
  const { data: assessments = [] } = useQuery({ queryKey: ["assessments"], queryFn: () => listFn() });
  const { data: history = [] } = useQuery({ queryKey: ["assessments-history"], queryFn: () => historyFn() });

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-brand-primary">
            <ClipboardCheck className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Autoavaliações</span>
          </div>
          <h1 className="text-3xl font-semibold">Instrumentos de triagem</h1>
          <p className="text-muted-foreground max-w-2xl">
            Questionários educativos para acompanhar sinais, rotina e bem estar. Não substituem avaliação clínica.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {assessments.map((a) => (
            <Link key={a.id} to="/app/autoavaliacoes/$slug" params={{ slug: a.slug }}>
              <Card className="h-full transition hover:border-brand-primary/40 hover:shadow-md">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{a.name}</h3>
                    <Badge variant="secondary" className="text-xs capitalize">{a.audience === "caregiver" ? "Cuidador" : a.audience === "professional" ? "Profissional" : "Família"}</Badge>
                  </div>
                  {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
                  {a.age_min_months && a.age_max_months && (
                    <p className="text-xs text-muted-foreground">Faixa etária: {a.age_min_months} a {a.age_max_months} meses</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><History className="h-5 w-5" /> Meus resultados</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você ainda não respondeu nenhuma autoavaliação.</p>
          ) : (
            <div className="space-y-2">
              {history.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{r.assessments?.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{r.band}</p>
                      <p className="text-xs text-muted-foreground">Escore: {r.score}</p>
                    </div>
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
