import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import ptBRCommon from "@/locales/pt-BR/common.json";
import ptBRLanding from "@/locales/pt-BR/landing.json";
import ptBRAuth from "@/locales/pt-BR/auth.json";
import ptBRApp from "@/locales/pt-BR/app.json";

/**
 * i18n do ATLAS.
 * Todo texto exibido ao usuário deve passar por t('namespace:chave').
 * Novos idiomas: adicionar arquivos em src/locales/<locale>/<namespace>.json
 * e registrar em `resources` abaixo.
 */
export const SUPPORTED_LOCALES = ["pt-BR", "en", "es", "fr", "it", "de"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        "pt-BR": {
          common: ptBRCommon,
          landing: ptBRLanding,
          auth: ptBRAuth,
          app: ptBRApp,
        },
      },
      fallbackLng: "pt-BR",
      supportedLngs: SUPPORTED_LOCALES as unknown as string[],
      ns: ["common", "landing", "auth", "app"],
      defaultNS: "common",
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

export default i18n;
