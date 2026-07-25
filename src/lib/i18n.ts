/**
 * Compatibilidade retroativa. A implementação real vive em `@/i18n`.
 * Componentes existentes continuam funcionando com `import i18n from "@/lib/i18n"`.
 */
export { default } from "@/i18n";
export {
  ensureI18n,
  changeLocale,
  currentLocale,
  getI18n,
  LOCALES,
  SUPPORTED_LOCALES,
  NAMESPACES,
} from "@/i18n";
export type { LocaleCode, SupportedLocale } from "@/i18n";
