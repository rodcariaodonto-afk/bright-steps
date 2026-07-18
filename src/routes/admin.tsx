import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Layout do Painel Administrativo.
 * Isolado de `/app` (família) e `/pro` (clínico) — nada é reutilizado.
 * Quando o Cloud voltar, migramos para `_authenticated/admin/*` com gate
 * `has_role('admin')` e RLS estrita.
 */
export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
