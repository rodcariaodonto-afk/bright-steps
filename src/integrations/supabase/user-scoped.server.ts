/**
 * User-scoped Supabase client para rotas TSS (`/api/*`) que NÃO usam
 * `requireSupabaseAuth` mas ainda precisam consultar dados respeitando RLS
 * como o próprio usuário do request.
 *
 * Espelha o comportamento de `src/integrations/supabase/auth-middleware.ts`:
 * usa a publishable key + custom fetch que envia `apikey` sem sobrescrever o
 * Bearer JWT do usuário. Server-only pela extensão `.server.ts`.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export interface UserScopedSupabaseResult {
  supabase: SupabaseClient<Database> | null;
  userId: string | null;
}

/**
 * Constrói um client Supabase escopado ao usuário a partir do header
 * `Authorization: Bearer <jwt>` da request. Retorna `{ supabase: null }`
 * quando não há token válido — o chamador deve tratar isso como
 * "sessão anônima" (fail-closed no gate de consentimento).
 */
export async function createUserScopedSupabaseFromRequest(
  request: Request,
): Promise<UserScopedSupabaseResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { supabase: null, userId: null };

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { supabase: null, userId: null };
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || token.split(".").length !== 3) return { supabase: null, userId: null };

  const supabase = createClient<Database>(url, key, {
    global: {
      fetch: createSupabaseFetch(key),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) return { supabase: null, userId: null };
    return { supabase, userId: String(data.claims.sub) };
  } catch {
    return { supabase: null, userId: null };
  }
}
