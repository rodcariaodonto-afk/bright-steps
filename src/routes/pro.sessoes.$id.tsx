import { createFileRoute } from "@tanstack/react-router";

import { ProPage, ProCard } from "@/components/pro/pro-page";

export const Route = createFileRoute("/pro/sessoes/$id")({
  component: SessionDetailPage,
});

function SessionDetailPage() {
  const { id } = Route.useParams();
  return (
    <ProPage title={`Sessão · ${id}`}>
      <ProCard description="A visualização completa da sessão entra na Onda 2.">
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          Detalhes da sessão indisponíveis nesta prévia.
        </div>
      </ProCard>
    </ProPage>
  );
}
