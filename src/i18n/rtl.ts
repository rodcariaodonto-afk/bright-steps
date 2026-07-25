import { LOCALES, type LocaleCode } from "./config";

/**
 * Aplica dir + lang no elemento <html> para todo idioma trocado.
 * Idiomas RTL (árabe) inverte o layout via CSS logical properties.
 */
export function applyDocumentDirection(locale: LocaleCode): void {
  if (typeof document === "undefined") return;
  const meta = LOCALES[locale];
  if (!meta) return;
  const html = document.documentElement;
  html.setAttribute("lang", locale);
  html.setAttribute("dir", meta.dir);
  html.dataset.locale = locale;
}
