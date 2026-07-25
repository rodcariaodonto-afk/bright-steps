import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  childName?: string | null;
}

/**
 * Cartão hero de entrada para o "Mundo Azul" (modo criança).
 * Substitui o antigo botão discreto na topbar.
 */
export function DashboardMundoAzulCard({ childName }: Props) {
  const { t } = useTranslation("app");

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white shadow-lg md:p-8">
      {/* bolhas decorativas */}
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-3xl backdrop-blur-sm" aria-hidden>
            💙
          </div>
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest backdrop-blur-sm">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {t("dashboard.kidMode.eyebrow")}
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight md:text-3xl">
              {t("dashboard.kidMode.title")}
            </h2>
            <p className="mt-1 max-w-md text-sm text-white/90">
              {childName
                ? t("dashboard.kidMode.descriptionWithChild", { childName })
                : t("dashboard.kidMode.description")}
            </p>
          </div>
        </div>

        <Link
          to="/kid"
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-white/95 md:text-base"
        >
          {t("dashboard.kidMode.cta")}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
