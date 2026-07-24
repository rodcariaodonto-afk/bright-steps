import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { ProShell } from "@/components/pro/pro-shell";
import { supabase } from "@/integrations/supabase/client";

/**
 * Layout do Módulo Profissionais. Requer sessão ativa.
 */
export const Route = createFileRoute("/pro")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: ProLayout,
});

function ProLayout() {
  return (
    <ProShell>
      <Outlet />
    </ProShell>
  );
}
