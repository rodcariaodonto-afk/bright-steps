import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Brain,
  RefreshCw,
  BookOpen,
  AlertCircle,
  SmilePlus,
  Activity,
  Pill,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getChildInsights } from "@/modules/insights/api.functions";

interface PatternsCardProps {
  childId: string;
  variant?: "family" | "pro";
}

export function PatternsCard({ childId, variant = "family" }: PatternsCardProps) {
  const fetchInsights = useServerFn(getChildInsights);
  const qc = useQueryClient();
  const queryKey = ["insights", childId];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchInsights({ data: { childId } }),
    staleTime: 1000 * 60 * 30,
  });

  const refresh = useMutation({
    mutationFn: () => fetchInsights({ data: { childId, force: true } }),
    onSuccess: (result) => qc.setQueryData(queryKey, result),
  });

  const isPro = variant === "pro";
  const wrapper = isPro
    ? "rounded-xl border border-border/60 bg-card p-5"
    : "rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary-soft/60 to-accent/10 p-6 shadow-sm";
  const HeaderIcon = isPro ? Sparkles : Brain;

  return (
    <section className={wrapper} aria-labelledby={`patterns-${childId}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <HeaderIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Padrões detectados pela Azul
            </p>
            <h2
              id={`patterns-${childId}`}
              className="font-display text-lg font-bold text-foreground"
            >
              Últimos 30 dias
            </h2>
            {!isPro && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Análise automática de humor, comportamento e medicação.
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant={isPro ? "ghost" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending || isLoading}
        >
          <RefreshCw
            className={`mr-1.5 h-3.5 w-3.5 ${refresh.isPending ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Atualizar
        </Button>
      </header>

      <div className="mt-4">
        {isLoading || refresh.isPending ? (
          <p className="text-sm text-muted-foreground">Analisando registros…</p>
        ) : isError ? (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            Não foi possível carregar os padrões.
          </p>
        ) : data?.status === "empty" ? (
          <EmptyInsights variant={variant} message={data.message} />
        ) : data?.status === "error" ? (
          <p className="text-sm text-muted-foreground">
            {data.message ?? "Serviço temporariamente indisponível."}
          </p>
        ) : data && data.insights.length > 0 ? (
          <ul className="space-y-3">
            {data.insights.map((p, idx) => (
              <li
                key={idx}
                className="rounded-2xl border border-border/60 bg-card p-4"
              >
                <p className="font-semibold text-foreground">{p.title}</p>
                <p className="mt-1 text-sm text-foreground/80">{p.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Evidência: {p.evidence}
                </p>
                {p.suggested_article_slug && (
                  <Link
                    to="/app/biblioteca/$slug"
                    params={{ slug: p.suggested_article_slug }}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    Ler artigo relacionado
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ainda não há padrões para exibir.
          </p>
        )}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Estes padrões são observações apoiadas por IA sobre os registros recentes. Não
        são diagnóstico. Converse com a equipe clínica antes de tomar decisões.
      </p>
    </section>
  );
}

function EmptyInsights({
  variant,
  message,
}: {
  variant: "family" | "pro";
  message?: string;
}) {
  if (variant === "pro") {
    return (
      <p className="text-sm text-muted-foreground">
        {message ?? "Ainda não há dados suficientes."}
      </p>
    );
  }
  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-card/60 p-4">
      <p className="text-sm text-foreground">
        {message ??
          "Ainda não há dados suficientes dos últimos 30 dias para detectar padrões."}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Registre ao menos 5 eventos nos próximos dias para a Azul começar a
        identificar padrões.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="secondary" className="rounded-full">
          <Link to="/app/humor">
            <SmilePlus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Registrar humor
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary" className="rounded-full">
          <Link to="/app/comportamento">
            <Activity className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Registrar comportamento
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary" className="rounded-full">
          <Link to="/app/medicacao">
            <Pill className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Registrar medicação
          </Link>
        </Button>
      </div>
    </div>
  );
}
