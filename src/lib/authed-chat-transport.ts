import { DefaultChatTransport } from "ai";

import { supabase } from "@/integrations/supabase/client";

/**
 * DefaultChatTransport que anexa `Authorization: Bearer <jwt>` a cada
 * mensagem, usando a sessão atual do Supabase. Sem sessão → nenhum header
 * é enviado e o servidor cai no fail-closed do gate de consentimento.
 */
export function createAuthedChatTransport(init: {
  api: string;
  body?: Record<string, unknown>;
}) {
  return new DefaultChatTransport({
    api: init.api,
    body: init.body,
    headers: async (): Promise<Record<string, string>> => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
}
