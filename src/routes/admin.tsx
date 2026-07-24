import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";
import { supabase } from "@/integrations/supabase/client";

/**
 * Layout do Painel Administrativo.
 * Gate: exige sessão + papel `admin` via `has_role(auth.uid(), 'admin')`.
 * `ssr: false` porque a sessão Supabase vive no localStorage.
 */
export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) throw redirect({ to: "/auth" });

    const { data: isAdmin, error } = await supabase.rpc("has_role", {
      _user_id: session.user.id,
      _role: "admin",
    });
    if (error || !isAdmin) throw redirect({ to: "/app" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
