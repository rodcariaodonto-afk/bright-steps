import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useLocale } from "@/i18n/hooks";
import { getTranslatedContent } from "@/lib/content-translation.functions";

interface TranslatedPayload {
  title: string;
  summary?: string | null;
  description?: string | null;
  config?: unknown;
}

/**
 * Devolve título/descrição/config traduzidos para o idioma ativo.
 * Enquanto a tradução carrega, devolve `fallback` (o conteúdo original).
 */
export function useTranslatedContent<T extends TranslatedPayload>(
  entityType: "story" | "game",
  entityId: string | null | undefined,
  fallback: T,
): { data: T; loading: boolean } {
  const { locale } = useLocale();
  const fetchFn = useServerFn(getTranslatedContent);
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityId) return;
    // Locale igual ao source: nem chama backend.
    if (locale === "pt-BR") {
      setData(fallback);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchFn({ data: { entityType, entityId, locale } })
      .then((res) => {
        if (cancelled) return;
        setData({ ...fallback, ...(res.payload as Partial<T>) });
      })
      .catch(() => {
        if (cancelled) return;
        setData(fallback);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId, locale]);

  return { data, loading };
}
