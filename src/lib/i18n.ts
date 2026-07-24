import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import ptBRCommon from "@/locales/pt-BR/common.json";
import ptBRLanding from "@/locales/pt-BR/landing.json";
import ptBRAuth from "@/locales/pt-BR/auth.json";
import ptBRApp from "@/locales/pt-BR/app.json";
import ptBRPro from "@/locales/pt-BR/pro.json";
import ptBRAdmin from "@/locales/pt-BR/admin.json";
import ptBRAi from "@/locales/pt-BR/ai.json";
import ptBRKid from "@/locales/pt-BR/kid.json";

export const SUPPORTED_LOCALES = ["pt-BR", "en", "es", "fr", "it", "de"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const isBrowser = typeof window !== "undefined";

if (!i18n.isInitialized) {
  const chain = isBrowser
    ? i18n.use(LanguageDetector).use(initReactI18next)
    : i18n.use(initReactI18next);

  void chain.init({
    resources: {
      "pt-BR": {
        common: ptBRCommon,
        landing: ptBRLanding,
        auth: ptBRAuth,
        app: ptBRApp,
        pro: ptBRPro,
        admin: ptBRAdmin,
        ai: ptBRAi,
        kid: ptBRKid,
      },
    },
    lng: isBrowser ? undefined : "pt-BR",
    fallbackLng: "pt-BR",
    supportedLngs: SUPPORTED_LOCALES as unknown as string[],
    ns: ["common", "landing", "auth", "app", "pro", "admin", "ai", "kid"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    initImmediate: false,
  } as Parameters<typeof chain.init>[0]);
}

export default i18n;

