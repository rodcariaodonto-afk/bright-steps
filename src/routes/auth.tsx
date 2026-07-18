import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Apple } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AtlasLogo } from "@/components/atlas/atlas-logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Meu Mundo Azul" },
      {
        name: "description",
        content: "Acesse o Meu Mundo Azul para acompanhar a jornada da sua família.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation(["auth", "common"]);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const navigate = useNavigate();

  const notReady = () => {
    toast.warning(t("auth:cloudPending.title"), {
      description: t("auth:cloudPending.message"),
    });
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="grid min-h-dvh lg:grid-cols-2">
        {/* Painel esquerdo */}
        <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(45% 45% at 25% 20%, oklch(0.95 0.05 40) 0%, transparent 60%), radial-gradient(50% 50% at 80% 70%, oklch(0.9 0.08 165) 0%, transparent 60%)",
            }}
          />
          <div className="relative">
            <Link to="/" aria-label="Meu Mundo Azul">
              <AtlasLogo />
            </Link>
          </div>
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-widest opacity-80">
              {t("common:brand.tagline")}
            </p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">
              Cada criança é única.
              <br />O Meu Mundo Azul caminha ao lado.
            </h1>
            <p className="mt-6 max-w-md text-base opacity-90">
              Reúna rotina, terapias, humor e evolução em um lugar acolhedor,
              seguro e feito para durar por muitos anos.
            </p>
          </div>
          <div className="relative flex items-center gap-3 text-xs opacity-80">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Feito com respeito à LGPD e à privacidade da criança.</span>
          </div>
        </div>

        {/* Formulário */}
        <div className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            <div className="lg:hidden">
              <Link to="/" aria-label="Meu Mundo Azul">
                <AtlasLogo />
              </Link>
              <div className="mt-6" />
            </div>

            <h2 className="font-display text-3xl font-bold text-foreground">
              {t(mode === "signIn" ? "auth:signIn.title" : "auth:signUp.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(
                mode === "signIn"
                  ? "auth:signIn.subtitle"
                  : "auth:signUp.subtitle",
              )}
            </p>

            <form
              className="mt-8 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                notReady();
              }}
            >
              {mode === "signUp" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t("auth:signUp.name")}</Label>
                  <Input id="name" name="name" autoComplete="name" required />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  {t(
                    mode === "signIn" ? "auth:signIn.email" : "auth:signUp.email",
                  )}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">
                  {t(
                    mode === "signIn"
                      ? "auth:signIn.password"
                      : "auth:signUp.password",
                  )}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "signIn" ? "current-password" : "new-password"
                  }
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full rounded-full">
                {t(
                  mode === "signIn"
                    ? "auth:signIn.submit"
                    : "auth:signUp.submit",
                )}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              ou
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full rounded-full"
              onClick={notReady}
            >
              <Apple className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("auth:signIn.apple")}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="mt-4 w-full text-xs"
              onClick={() => navigate({ to: "/app" })}
            >
              {t("auth:cloudPending.explore")} →
            </Button>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {mode === "signIn"
                ? t("auth:signIn.noAccount")
                : t("auth:signUp.hasAccount")}{" "}
              <button
                type="button"
                onClick={() =>
                  setMode((prev) => (prev === "signIn" ? "signUp" : "signIn"))
                }
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {mode === "signIn"
                  ? t("auth:signIn.createOne")
                  : t("auth:signUp.goSignIn")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
