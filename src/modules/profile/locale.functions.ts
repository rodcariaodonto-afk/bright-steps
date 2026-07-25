import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SUPPORTED_LOCALES } from "@/i18n/config";

const localeSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES as [string, ...string[]]),
  timezone: z.string().max(64).optional(),
});

/**
 * Persiste o idioma (e timezone opcional) no perfil do usuário logado.
 * RLS garante que o usuário só pode atualizar o próprio perfil.
 */
export const updateProfileLocale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => localeSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        locale: data.locale,
        ...(data.timezone ? { timezone: data.timezone } : {}),
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, locale: data.locale };
  });

export const getMyProfileLocale = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("locale, timezone")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      locale: (data?.locale as string | null) ?? null,
      timezone: (data?.timezone as string | null) ?? null,
    };
  });
