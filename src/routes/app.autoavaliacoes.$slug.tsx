import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/atlas/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAssessment, submitAssessment } from "@/modules/assessments/api.functions";

type Question = { id: string; text: string; risk: "yes" | "no" };

export const Route = createFileRoute("/app/autoavaliacoes/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} | Autoavaliação Meu Mundo Azul` }],
  }),
  errorComponent: ({ error }) => <AppShell><p className="text-destructive">{error.message}</p></AppShell>,
  notFoundComponent: () => <AppShell><p>Não encontrada.</p></AppShell>,
  component: AssessmentRunner,
});

function AssessmentRunner() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getAssessment);
  const submitFn = useServerFn(submitAssessment);
  const { data: assessment, isLoading } = useQuery({
    queryKey: ["assessment", slug],
    queryFn: () => getFn({ data: { slug } }),
  });
  const [answers, setAnswers] = useState<Record<string, "yes" | "no">>({});
  const [result, setResult] = useState<{ score: number; band: string } | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      submitFn({ data: { assessmentId: assessment!.id, answers } }),
    onSuccess: (r) => {
      setResult({ score: r.score ?? 0, band: r.band ?? "" });
      toast.success("Respostas registradas");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  if (isLoading || !assessment) return <AppShell><p>Carregando...</p></AppShell>;
  const questions = (assessment.questions as unknown as Question[]) ?? [];
  const allAnswered = questions.every((q) => answers[q.id]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link to="/app/autoavaliacoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">{assessment.name}</h1>
          {assessment.description && <p className="text-muted-foreground">{assessment.description}</p>}
          {assessment.disclaimer && (
            <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300 p-3 rounded-md">
              {assessment.disclaimer}
            </p>
          )}
        </header>

        {result ? (
          <Card>
            <CardContent className="p-6 space-y-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-brand-primary mx-auto" />
              <h2 className="text-xl font-semibold">Resultado</h2>
              <p className="text-3xl font-bold">{result.band}</p>
              <p className="text-sm text-muted-foreground">Escore total: {result.score}</p>
              <div className="flex justify-center gap-2 pt-2">
                <Button variant="outline" onClick={() => { setResult(null); setAnswers({}); }}>Refazer</Button>
                <Button onClick={() => navigate({ to: "/app/autoavaliacoes" })}>Concluir</Button>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Este resultado é orientativo. Compartilhe com a equipe terapêutica ou pediatra.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <Card key={q.id}>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm"><span className="font-medium text-muted-foreground">{idx + 1}.</span> {q.text}</p>
                    <div className="flex gap-2">
                      {(["yes", "no"] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: v }))}
                          className={`flex-1 py-2 rounded-md border text-sm font-medium transition ${
                            answers[q.id] === v
                              ? "bg-brand-primary text-white border-brand-primary"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          {v === "yes" ? "Sim" : "Não"}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button onClick={() => submit.mutate()} disabled={!allAnswered || submit.isPending} className="w-full">
              {submit.isPending ? "Enviando..." : allAnswered ? "Ver resultado" : `Responda todas as ${questions.length} questões`}
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
