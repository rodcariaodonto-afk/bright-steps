import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { ProShell } from "@/components/pro/pro-shell";
import { supabase } from "@/integrations/supabase/client";
import { getMyClinicalAccess } from "@/modules/marketplace/api.functions";

/**
 * Layout do Módulo Profissionais.
 * Requer: sessão ativa + papel "professional"/"admin" (getMyClinicalAccess)
 * + assinatura ativa do plano "profissional_clinica" (verificada no client
 * pelo ProShell através de useSubscription — mantemos aqui apenas o gate
 * de papel para não travar admins que não têm plano).
 */
export const Route = createFileRoute("/pro")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    try {
      const access = await getMyClinicalAccess();
      if (!access?.hasAccess) {
        throw redirect({ to: "/seja-profissional" });
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in (err as Record<string, unknown>)) throw err;
      throw redirect({ to: "/seja-profissional" });
    }
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
