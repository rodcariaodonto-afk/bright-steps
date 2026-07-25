/**
 * Configuração central de i18n/l10n.
 * Adicionar novo idioma: adicionar entrada em LOCALES + criar pasta em src/locales/<code>/
 * com pelo menos common.json. Demais namespaces caem em cascata para EN → PT-BR.
 */

export type LocaleCode =
  | "pt-BR"
  | "en"
  | "es"
  | "fr"
  | "it"
  | "de"
  | "nl"
  | "pl"
  | "tr"
  | "ar"
  | "ja"
  | "ko"
  | "zh-CN"
  | "zh-TW"
  | "ru";

export interface LocaleMeta {
  code: LocaleCode;
  /** Nome nativo (mostrado no seletor) */
  nativeName: string;
  /** Nome em inglês (para logs/debug) */
  englishName: string;
  /** Bandeira emoji */
  flag: string;
  /** Direção do texto */
  dir: "ltr" | "rtl";
  /** Locale BCP-47 usado no Intl API (pode diferir do code) */
  intlLocale: string;
  /** Moeda padrão sugerida (ISO 4217) */
  defaultCurrency: string;
  /** Primeiro dia da semana: 0 = domingo, 1 = segunda */
  firstDayOfWeek: 0 | 1 | 6;
  /** Sistema de unidades */
  measurementSystem: "metric" | "imperial";
  /** País principal para fallback regional */
  country: string;
}

export const LOCALES: Record<LocaleCode, LocaleMeta> = {
  "pt-BR": {
    code: "pt-BR",
    nativeName: "Português (Brasil)",
    englishName: "Portuguese (Brazil)",
    flag: "🇧🇷",
    dir: "ltr",
    intlLocale: "pt-BR",
    defaultCurrency: "BRL",
    firstDayOfWeek: 0,
    measurementSystem: "metric",
    country: "BR",
  },
  en: {
    code: "en",
    nativeName: "English",
    englishName: "English",
    flag: "🇺🇸",
    dir: "ltr",
    intlLocale: "en-US",
    defaultCurrency: "USD",
    firstDayOfWeek: 0,
    measurementSystem: "imperial",
    country: "US",
  },
  es: {
    code: "es",
    nativeName: "Español",
    englishName: "Spanish",
    flag: "🇪🇸",
    dir: "ltr",
    intlLocale: "es-ES",
    defaultCurrency: "EUR",
    firstDayOfWeek: 1,
    measurementSystem: "metric",
    country: "ES",
  },
  fr: {
    code: "fr",
    nativeName: "Français",
    englishName: "French",
    flag: "🇫🇷",
    dir: "ltr",
    intlLocale: "fr-FR",
    defaultCurrency: "EUR",
    firstDayOfWeek: 1,
    measurementSystem: "metric",
    country: "FR",
  },
  it: {
    code: "it",
    nativeName: "Italiano",
    englishName: "Italian",
    flag: "🇮🇹",
    dir: "ltr",
    intlLocale: "it-IT",
    defaultCurrency: "EUR",
    firstDayOfWeek: 1,
    measurementSystem: "metric",
    country: "IT",
  },
  de: {
    code: "de",
    nativeName: "Deutsch",
    englishName: "German",
    flag: "🇩🇪",
    dir: "ltr",
    intlLocale: "de-DE",
    defaultCurrency: "EUR",
    firstDayOfWeek: 1,
    measurementSystem: "metric",
    country: "DE",
  },
  nl: {
    code: "nl",
    nativeName: "Nederlands",
    englishName: "Dutch",
    flag: "🇳🇱",
    dir: "ltr",
    intlLocale: "nl-NL",
    defaultCurrency: "EUR",
    firstDayOfWeek: 1,
    measurementSystem: "metric",
    country: "NL",
  },
  pl: {
    code: "pl",
    nativeName: "Polski",
    englishName: "Polish",
    flag: "🇵🇱",
    dir: "ltr",
    intlLocale: "pl-PL",
    defaultCurrency: "PLN",
    firstDayOfWeek: 1,
    measurementSystem: "metric",
    country: "PL",
  },
  tr: {
    code: "tr",
    nativeName: "Türkçe",
    englishName: "Turkish",
    flag: "🇹🇷",
    dir: "ltr",
    intlLocale: "tr-TR",
    defaultCurrency: "TRY",
    firstDayOfWeek: 1,
    measurementSystem: "metric",
    country: "TR",
  },
  ar: {
    code: "ar",
    nativeName: "العربية",
    englishName: "Arabic",
    flag: "🇸🇦",
    dir: "rtl",
    intlLocale: "ar-SA",
    defaultCurrency: "SAR",
    firstDayOfWeek: 6,
    measurementSystem: "metric",
    country: "SA",
  },
  ja: {
    code: "ja",
    nativeName: "日本語",
    englishName: "Japanese",
    flag: "🇯🇵",
    dir: "ltr",
    intlLocale: "ja-JP",
    defaultCurrency: "JPY",
    firstDayOfWeek: 0,
    measurementSystem: "metric",
    country: "JP",
  },
  ko: {
    code: "ko",
    nativeName: "한국어",
    englishName: "Korean",
    flag: "🇰🇷",
    dir: "ltr",
    intlLocale: "ko-KR",
    defaultCurrency: "KRW",
    firstDayOfWeek: 0,
    measurementSystem: "metric",
    country: "KR",
  },
  "zh-CN": {
    code: "zh-CN",
    nativeName: "简体中文",
    englishName: "Chinese (Simplified)",
    flag: "🇨🇳",
    dir: "ltr",
    intlLocale: "zh-CN",
    defaultCurrency: "CNY",
    firstDayOfWeek: 1,
    measurementSystem: "metric",
    country: "CN",
  },
  "zh-TW": {
    code: "zh-TW",
    nativeName: "繁體中文",
    englishName: "Chinese (Traditional)",
    flag: "🇹🇼",
    dir: "ltr",
    intlLocale: "zh-TW",
    defaultCurrency: "TWD",
    firstDayOfWeek: 0,
    measurementSystem: "metric",
    country: "TW",
  },
  ru: {
    code: "ru",
    nativeName: "Русский",
    englishName: "Russian",
    flag: "🇷🇺",
    dir: "ltr",
    intlLocale: "ru-RU",
    defaultCurrency: "RUB",
    firstDayOfWeek: 1,
    measurementSystem: "metric",
    country: "RU",
  },
};

export const SUPPORTED_LOCALES: LocaleCode[] = Object.keys(LOCALES) as LocaleCode[];

/** Idioma padrão global (fallback final) */
export const DEFAULT_LOCALE: LocaleCode = "en";

/** Locale nativo da equipe (source of truth para strings novas) */
export const SOURCE_LOCALE: LocaleCode = "pt-BR";

/** Namespaces disponíveis */
export const NAMESPACES = [
  "common",
  "landing",
  "auth",
  "app",
  "pro",
  "admin",
  "ai",
  "kid",
] as const;
export type Namespace = (typeof NAMESPACES)[number];

/** Cascata de fallback: idioma pedido → EN → PT-BR */
export const FALLBACK_LOCALES: LocaleCode[] = ["en", "pt-BR"];

export function isRTL(code: string | null | undefined): boolean {
  if (!code) return false;
  const meta = LOCALES[code as LocaleCode];
  return meta?.dir === "rtl";
}

/**
 * Normaliza qualquer BCP-47 recebido (ex: "pt", "pt-BR", "pt_BR", "fr-CA")
 * para um LocaleCode suportado. Retorna null se nenhum match.
 */
export function normalizeLocale(input: string | null | undefined): LocaleCode | null {
  if (!input) return null;
  const raw = input.replace("_", "-").trim();
  if (!raw) return null;

  // Match exato
  if (raw in LOCALES) return raw as LocaleCode;

  // Match case-insensitive
  const upper = raw.toLowerCase();
  for (const code of SUPPORTED_LOCALES) {
    if (code.toLowerCase() === upper) return code;
  }

  // Match por família (pt-PT → pt-BR, fr-CA → fr)
  const primary = raw.split("-")[0].toLowerCase();
  const familyMap: Record<string, LocaleCode> = {
    pt: "pt-BR",
    en: "en",
    es: "es",
    fr: "fr",
    it: "it",
    de: "de",
    nl: "nl",
    pl: "pl",
    tr: "tr",
    ar: "ar",
    ja: "ja",
    ko: "ko",
    zh: raw.toLowerCase().includes("tw") || raw.toLowerCase().includes("hk") ? "zh-TW" : "zh-CN",
    ru: "ru",
  };
  return familyMap[primary] ?? null;
}

/** Match aproximado por país (ISO 3166-1 alpha-2). */
export function localeByCountry(country: string | null | undefined): LocaleCode | null {
  if (!country) return null;
  const c = country.toUpperCase();
  const map: Record<string, LocaleCode> = {
    BR: "pt-BR", PT: "pt-BR", AO: "pt-BR", MZ: "pt-BR",
    US: "en", GB: "en", CA: "en", AU: "en", NZ: "en", IE: "en", ZA: "en", IN: "en",
    ES: "es", MX: "es", AR: "es", CL: "es", CO: "es", PE: "es", VE: "es", UY: "es",
    FR: "fr", BE: "fr", CH: "fr", LU: "fr", MC: "fr",
    IT: "it", SM: "it", VA: "it",
    DE: "de", AT: "de", LI: "de",
    NL: "nl",
    PL: "pl",
    TR: "tr",
    SA: "ar", AE: "ar", EG: "ar", MA: "ar", DZ: "ar", TN: "ar", IQ: "ar", JO: "ar",
    KW: "ar", QA: "ar", BH: "ar", OM: "ar", YE: "ar", SY: "ar", LB: "ar", LY: "ar",
    JP: "ja",
    KR: "ko",
    CN: "zh-CN", SG: "zh-CN",
    TW: "zh-TW", HK: "zh-TW", MO: "zh-TW",
    RU: "ru", BY: "ru", KZ: "ru",
  };
  return map[c] ?? null;
}
