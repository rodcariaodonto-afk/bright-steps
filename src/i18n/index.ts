import i18next, { type i18n as I18nInstance } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next, setDefaults } from "react-i18next";

import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALES,
  LOCALES,
  NAMESPACES,
  SUPPORTED_LOCALES,
  type LocaleCode,
  type Namespace,
} from "./config";
import { applyDocumentDirection } from "./rtl";

setDefaults({ useSuspense: false });

/**
 * Todos os JSONs de tradução são resolvidos via Vite glob.
 * Cada namespace de cada idioma vira um chunk lazy separado.
 * Arquivos ausentes caem na cascata de fallback (idioma → EN → PT-BR).
 */
const translationModules = import.meta.glob<{ default: Record<string, unknown> }>(
  "../locales/*/*.json",
);

async function loadNamespace(
  locale: string,
  ns: string,
): Promise<Record<string, unknown>> {
  const key = `../locales/${locale}/${ns}.json`;
  const loader = translationModules[key];
  if (!loader) return {};
  try {
    const mod = await loader();
    return (mod.default ?? {}) as Record<string, unknown>;
  } catch (err) {
    console.warn(`[i18n] Falha ao carregar ${key}`, err);
    return {};
  }
}

let bootstrapPromise: Promise<I18nInstance> | null = null;

export function getI18n(): I18nInstance {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap();
  }
  return i18next;
}

export async function ensureI18n(initialLocale?: LocaleCode): Promise<I18nInstance> {
  // Só usa `initialLocale` no primeiro bootstrap. Chamadas subsequentes
  // (loader do root a cada navegação) NÃO devem forçar reset — isso
  // sobrescrevia a escolha do usuário/perfil/detector a cada page change.
  if (!bootstrapPromise) bootstrapPromise = bootstrap(initialLocale);
  await bootstrapPromise;
  return i18next;
}

async function bootstrap(initialLocale: LocaleCode = DEFAULT_LOCALE): Promise<I18nInstance> {
  if (i18next.isInitialized) return i18next;
  await i18next
    .use(resourcesToBackend((lng: string, ns: string) => loadNamespace(lng, ns)))
    .use(initReactI18next)
    .init({
      lng: initialLocale,
      fallbackLng: FALLBACK_LOCALES,
      supportedLngs: SUPPORTED_LOCALES as unknown as string[],
      ns: NAMESPACES as unknown as string[],
      defaultNS: "common",
      load: "currentOnly",
      partialBundledLanguages: true,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
      returnEmptyString: false,
    });

  applyDocumentDirection(initialLocale);
  return i18next;
}

export async function changeLocale(locale: LocaleCode): Promise<void> {
  if (!LOCALES[locale]) return;
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap(locale);
    await bootstrapPromise;
    return;
  }
  await bootstrapPromise;
  await i18next.changeLanguage(locale);
  applyDocumentDirection(locale);
}

export function currentLocale(): LocaleCode {
  const raw = i18next.language ?? DEFAULT_LOCALE;
  return (raw in LOCALES ? raw : DEFAULT_LOCALE) as LocaleCode;
}

export { LOCALES, SUPPORTED_LOCALES, NAMESPACES } from "./config";
export type { LocaleCode, Namespace };
export default i18next;
