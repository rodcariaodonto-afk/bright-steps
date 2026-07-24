import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { KidShell } from "@/components/atlas/kid-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/kid")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: () => (
    <KidShell>
      <Outlet />
    </KidShell>
  ),
});
