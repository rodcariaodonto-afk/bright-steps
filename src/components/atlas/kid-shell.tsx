import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, MessageCircleHeart, Smile, Wind, BookOpen, Gamepad2, LogOut, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import { useActiveChild } from "@/hooks/use-active-child";
import { useKidRewards } from "@/hooks/use-kid-rewards";
import { cn } from "@/lib/utils";

type NavItem = {
  to: "/kid" | "/kid/azul" | "/kid/humor" | "/kid/respirar" | "/kid/historias" | "/kid/jogos";
  key: string;
  icon: typeof Home;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { to: "/kid", key: "home", exact: true, icon: Home },
  { to: "/kid/jogos", key: "games", icon: Gamepad2 },
  { to: "/kid/azul", key: "azul", icon: MessageCircleHeart },
  { to: "/kid/humor", key: "mood", icon: Smile },
  { to: "/kid/respirar", key: "breathe", icon: Wind },
  { to: "/kid/historias", key: "stories", icon: BookOpen },
];

export function KidShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation("kid");
  const { activeChild } = useActiveChild();
  const { stars } = useKidRewards(activeChild?.id);
  const location = useLocation();
  const navigate = useNavigate();

  const name = activeChild?.nickname ?? activeChild?.full_name?.split(" ")[0];

  return (
    <div className="kid-scope min-h-screen bg-gradient-to-b from-[#7fd0ff] via-[#a4dcff] to-[#dff2ff] text-[#0b2740]">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/40 border-b border-white/60">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-md text-2xl">
            🌊
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#0b2740]/60">
              {t("shell.title")}
            </div>
            <div className="text-lg font-black leading-tight">
              {name ? t("shell.greeting", { name }) : t("shell.greetingFallback")}
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-yellow-300 px-3 py-1.5 shadow-md">
            <Star className="h-4 w-4 fill-yellow-600 text-yellow-700" aria-hidden />
            <span className="text-sm font-black text-yellow-900">{stars}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/app" })}
            className="ml-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-[#0b2740] shadow-md hover:bg-white"
            aria-label={t("shell.exit")}
          >
            <LogOut className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-32 pt-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-stretch justify-between gap-1 px-2 py-2">
          {NAV.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[11px] font-bold transition",
                  active
                    ? "bg-[#0b6cff] text-white shadow-lg"
                    : "text-[#0b2740]/70 hover:bg-white",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{t(`shell.nav.${item.key}`)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
