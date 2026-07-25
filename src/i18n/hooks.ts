import { useTranslation } from "react-i18next";

import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from "./config";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
} from "./format";

/**
 * Hook central: idioma ativo + helpers de formatação já vinculados.
 * Usar em componentes que precisam de data/número/moeda localizados.
 */
export function useLocale() {
  const { i18n } = useTranslation();
  const raw = i18n.language ?? DEFAULT_LOCALE;
  const locale = (raw in LOCALES ? raw : DEFAULT_LOCALE) as LocaleCode;
  const meta = LOCALES[locale];

  return {
    locale,
    meta,
    dir: meta.dir,
    isRTL: meta.dir === "rtl",
    formatDate: (d: Date | string | number, opts?: Intl.DateTimeFormatOptions) =>
      formatDate(d, locale, opts),
    formatTime: (d: Date | string | number, opts?: Intl.DateTimeFormatOptions) =>
      formatTime(d, locale, opts),
    formatDateTime: (d: Date | string | number, opts?: Intl.DateTimeFormatOptions) =>
      formatDateTime(d, locale, opts),
    formatRelative: (d: Date | string | number, base?: Date) =>
      formatRelative(d, locale, base),
    formatNumber: (n: number, opts?: Intl.NumberFormatOptions) =>
      formatNumber(n, locale, opts),
    formatCurrency: (n: number, currency?: string) =>
      formatCurrency(n, locale, currency),
    formatPercent: (n: number, fraction?: number) =>
      formatPercent(n, locale, fraction),
  };
}
