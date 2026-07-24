import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/planos/obrigado")({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Assinatura ativada, Meu Mundo Azul" },
      { name: "description", content: "Bem vindo! Sua assinatura foi ativada." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ObrigadoPage,
});

function ObrigadoPage() {
  const { session_id } = Route.useSearch();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-background p-8 text-center shadow-lg">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Assinatura ativada!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu período de teste começou agora. Você pode acompanhar tudo pelo painel Minha Assinatura.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild>
            <Link to="/app">Ir para o app</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/assinatura">Minha assinatura</Link>
          </Button>
        </div>
        {session_id && (
          <p className="mt-6 break-all text-[10px] text-muted-foreground">
            Referência: {session_id}
          </p>
        )}
      </div>
    </div>
  );
}
