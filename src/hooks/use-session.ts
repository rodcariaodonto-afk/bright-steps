import { useEffect, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export interface SessionProfile {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  initials: string;
  locale: string | null;
  timezone: string | null;
}

export interface SessionState {
  loading: boolean;
  session: Session | null;
  profile: SessionProfile | null;
  roles: string[];
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

function computeInitials(name: string | null, email: string | null): string {
  const source = (name ?? email ?? "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadExtras(current: Session | null) {
      if (!current) {
        setProfile(null);
        setRoles([]);
        return;
      }
      const userId = current.user.id;
      const metaName =
        (current.user.user_metadata?.full_name as string | undefined) ??
        (current.user.user_metadata?.name as string | undefined) ??
        null;
      const metaAvatar =
        (current.user.user_metadata?.avatar_url as string | undefined) ?? null;

      const [{ data: profileRow }, { data: roleRows }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, avatar_url, locale, timezone")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);

      if (!mounted) return;
      const fullName = profileRow?.full_name ?? metaName;
      const avatarUrl = profileRow?.avatar_url ?? metaAvatar;
      const email = current.user.email ?? null;
      setProfile({
        fullName,
        email,
        avatarUrl,
        initials: computeInitials(fullName, email),
        locale: (profileRow as { locale?: string | null } | null)?.locale ?? null,
        timezone: (profileRow as { timezone?: string | null } | null)?.timezone ?? null,
      });
      setRoles((roleRows ?? []).map((r) => r.role as string));
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      loadExtras(data.session).finally(() => mounted && setLoading(false));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      setSession(next);
      loadExtras(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    loading,
    session,
    profile,
    roles,
    isAdmin: roles.includes("admin") || roles.includes("global_admin"),
    signOut,
  };
}
