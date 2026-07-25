import {
  DEFAULT_LOCALE,
  type LocaleCode,
  localeByCountry,
  normalizeLocale,
} from "./config";

const STORAGE_KEY = "mma:locale";
const IP_CACHE_KEY = "mma:ip-locale";

/**
 * Ordem de detecção (primeiro que resolver ganha):
 *  1. profile.locale (passado como preferredLocale)
 *  2. localStorage
 *  3. navigator.language + navigator.languages
 *  4. timezone → mapa fraco
 *  5. IP geo (sessão)
 *  6. DEFAULT_LOCALE
 */
export async function detectLocale(preferredLocale?: string | null): Promise<LocaleCode> {
  // 1. Preferência do perfil (backend)
  const fromProfile = normalizeLocale(preferredLocale);
  if (fromProfile) return fromProfile;

  if (typeof window === "undefined") return DEFAULT_LOCALE;

  // 2. localStorage
  try {
    const stored = normalizeLocale(localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // ignore
  }

  // 3. navigator
  const navLangs: string[] = [];
  if (navigator.language) navLangs.push(navigator.language);
  if (navigator.languages) navLangs.push(...navigator.languages);
  for (const l of navLangs) {
    const norm = normalizeLocale(l);
    if (norm) return norm;
  }

  // 4. Timezone → sinal fraco
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fromTz = localeByTimezone(tz);
    if (fromTz) return fromTz;
  } catch {
    // ignore
  }

  // 5. IP (cache de sessão pra evitar chamadas repetidas)
  try {
    const cached = sessionStorage.getItem(IP_CACHE_KEY);
    if (cached) {
      const norm = normalizeLocale(cached);
      if (norm) return norm;
    } else {
      const country = await detectCountryByIP();
      if (country) {
        const fromCountry = localeByCountry(country);
        if (fromCountry) {
          sessionStorage.setItem(IP_CACHE_KEY, fromCountry);
          return fromCountry;
        }
      }
    }
  } catch {
    // ignore
  }

  return DEFAULT_LOCALE;
}

/** Persiste escolha manual do usuário (também sincronizada com o perfil). */
export function persistLocaleLocal(locale: LocaleCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

/** Mapa aproximado de timezone → país → locale. Sinal fraco. */
function localeByTimezone(tz: string | undefined): LocaleCode | null {
  if (!tz) return null;
  const map: Record<string, LocaleCode> = {
    "America/Sao_Paulo": "pt-BR",
    "America/Manaus": "pt-BR",
    "America/Recife": "pt-BR",
    "America/Fortaleza": "pt-BR",
    "America/Belem": "pt-BR",
    "America/Rio_Branco": "pt-BR",
    "America/Bahia": "pt-BR",
    "America/Cuiaba": "pt-BR",
    "Europe/Lisbon": "pt-BR",
    "America/New_York": "en",
    "America/Chicago": "en",
    "America/Denver": "en",
    "America/Los_Angeles": "en",
    "America/Anchorage": "en",
    "Pacific/Honolulu": "en",
    "America/Toronto": "en",
    "Europe/London": "en",
    "Australia/Sydney": "en",
    "Australia/Melbourne": "en",
    "Pacific/Auckland": "en",
    "Europe/Madrid": "es",
    "Europe/Paris": "fr",
    "Europe/Brussels": "fr",
    "Europe/Rome": "it",
    "Europe/Berlin": "de",
    "Europe/Vienna": "de",
    "Europe/Zurich": "de",
    "Europe/Amsterdam": "nl",
    "Europe/Warsaw": "pl",
    "Europe/Istanbul": "tr",
    "Asia/Riyadh": "ar",
    "Asia/Dubai": "ar",
    "Asia/Baghdad": "ar",
    "Africa/Cairo": "ar",
    "Asia/Tokyo": "ja",
    "Asia/Seoul": "ko",
    "Asia/Shanghai": "zh-CN",
    "Asia/Singapore": "zh-CN",
    "Asia/Taipei": "zh-TW",
    "Asia/Hong_Kong": "zh-TW",
    "Europe/Moscow": "ru",
    "Asia/Yekaterinburg": "ru",
  };
  return map[tz] ?? null;
}

/**
 * Detecta país por IP via server function (evita CORS + centraliza cache).
 * NÃO usa geolocation API do browser (não requer permissão GPS).
 */
async function detectCountryByIP(): Promise<string | null> {
  try {
    const { detectCountryFromRequest } = await import(
      "./detect-locale.functions"
    );
    const result = await detectCountryFromRequest();
    return result?.country ?? null;
  } catch {
    return null;
  }
}
