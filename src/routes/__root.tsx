import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import i18n, { ensureI18n, changeLocale } from "@/i18n";
import { detectLocale, getPersistedLocaleLocal } from "@/i18n/detector";
import { applyDocumentDirection } from "@/i18n/rtl";
import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from "@/i18n/config";
import { useSession } from "@/hooks/use-session";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/atlas/theme-provider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Meu Mundo Azul
        </p>
        <h1 className="mt-3 text-6xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Página não encontrada
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo não carregou como esperado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente novamente. Se persistir, volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-input bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    await ensureI18n(DEFAULT_LOCALE);
    return null;
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title:
          "Meu Mundo Azul: plataforma para o desenvolvimento infantil e o neurodesenvolvimento",
      },
      {
        name: "description",
        content:
          "Organize rotina, terapias, humor e medicações. Uma IA acolhedora acompanha a jornada da sua criança do TEA ao TDAH, dislexia e além.",
      },
      { name: "author", content: "Meu Mundo Azul" },
      { name: "theme-color", content: "#7fb8a6" },
      {
        property: "og:title",
        content: "Meu Mundo Azul: plataforma para o desenvolvimento infantil e o neurodesenvolvimento",
      },
      {
        property: "og:description",
        content:
          "Organize rotina, terapias, humor e medicações. Uma IA acolhedora acompanha a jornada da sua criança do TEA ao TDAH, dislexia e além.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Meu Mundo Azul: plataforma para o desenvolvimento infantil e o neurodesenvolvimento" },
      { name: "twitter:description", content: "Organize rotina, terapias, humor e medicações. Uma IA acolhedora acompanha a jornada da sua criança do TEA ao TDAH, dislexia e além." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ad79c343-5c44-40fa-8ec1-7a3ead503917/id-preview-2c1e861f--afa0e2ca-4a79-493f-a72d-abf236d68206.lovable.app-1784853571401.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ad79c343-5c44-40fa-8ec1-7a3ead503917/id-preview-2c1e861f--afa0e2ca-4a79-493f-a72d-abf236d68206.lovable.app-1784853571401.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const initialLocale: LocaleCode = DEFAULT_LOCALE;
  const dir = LOCALES[initialLocale].dir;
  return (
    <html lang={initialLocale} dir={dir}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  // Bootstrap i18n: detecta idioma (perfil > localStorage > navigator > timezone > IP)
  // e aplica lang/dir no <html>.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureI18n(DEFAULT_LOCALE);
      const detected = await detectLocale(null);
      if (cancelled) return;
      if (detected !== i18n.language) {
        await changeLocale(detected);
      } else {
        applyDocumentDirection(detected);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (
          event !== "SIGNED_IN" &&
          event !== "SIGNED_OUT" &&
          event !== "USER_UPDATED"
        )
          return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      return () => sub.subscription.unsubscribe();
    });
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <LocaleSync />
          <Outlet />
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

/** Sincroniza locale do perfil autenticado com o i18next. */
function LocaleSync() {
  const { profile } = useSession();
  useEffect(() => {
    const nextLocale = getPersistedLocaleLocal() ?? (profile?.locale as LocaleCode | undefined);
    if (!nextLocale) return;
    if (nextLocale === i18n.language) return;
    changeLocale(nextLocale).catch(() => undefined);
  }, [profile?.locale]);
  return null;
}
