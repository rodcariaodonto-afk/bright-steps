import { LOCALES, type LocaleCode } from "./config";

function intl(locale: LocaleCode): string {
  return LOCALES[locale]?.intlLocale ?? locale;
}

/** Formatação de data curta (ex: 25/07/2026). */
export function formatDate(
  date: Date | string | number,
  locale: LocaleCode,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" },
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(intl(locale), opts).format(d);
}

export function formatTime(
  date: Date | string | number,
  locale: LocaleCode,
  opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" },
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(intl(locale), opts).format(d);
}

export function formatDateTime(
  date: Date | string | number,
  locale: LocaleCode,
  opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(intl(locale), opts).format(d);
}

/** Formatação relativa: "há 3 dias", "in 2 hours" */
export function formatRelative(
  date: Date | string | number,
  locale: LocaleCode,
  base: Date = new Date(),
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const diffSec = Math.round((d.getTime() - base.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(intl(locale), { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < 31536000) return rtf.format(Math.round(diffSec / 2592000), "month");
  return rtf.format(Math.round(diffSec / 31536000), "year");
}

export function formatNumber(
  value: number,
  locale: LocaleCode,
  opts: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(intl(locale), opts).format(value);
}

export function formatCurrency(
  value: number,
  locale: LocaleCode,
  currency?: string,
): string {
  const cur = currency ?? LOCALES[locale]?.defaultCurrency ?? "USD";
  return new Intl.NumberFormat(intl(locale), {
    style: "currency",
    currency: cur,
  }).format(value);
}

export function formatPercent(
  value: number,
  locale: LocaleCode,
  fractionDigits = 0,
): string {
  return new Intl.NumberFormat(intl(locale), {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function firstDayOfWeek(locale: LocaleCode): 0 | 1 | 6 {
  return LOCALES[locale]?.firstDayOfWeek ?? 1;
}
