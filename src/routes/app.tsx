import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/atlas/app-shell";

/**
 * Layout do módulo Família.
 * Quando o Cloud for ativado, criaremos `src/routes/_authenticated/route.tsx`
 * (gerido pela integração Supabase) e moveremos as sub-rotas para lá.
 * Por enquanto o subtree `/app/*` é aberto e mostra placeholders.
 */
export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
