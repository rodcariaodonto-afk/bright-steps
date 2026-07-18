import { createFileRoute, Outlet } from "@tanstack/react-router";

import { ProShell } from "@/components/pro/pro-shell";

/**
 * Layout do Módulo Profissionais.
 * Isolado de `/app` (família) — nada é reutilizado.
 * Quando o Cloud voltar, migramos o subtree para `_authenticated/pro/*`
 * e adicionamos gate por `has_role('professional')`.
 */
export const Route = createFileRoute("/pro")({
  component: ProLayout,
});

function ProLayout() {
  return (
    <ProShell>
      <Outlet />
    </ProShell>
  );
}
