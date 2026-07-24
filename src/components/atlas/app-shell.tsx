import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Baby,
  ListChecks,
  CalendarDays,
  Repeat,
  Pill,
  FileText,
  SmilePlus,
  Activity,
  Target,
  BarChart3,
  Sparkles,
  Bell,
  Settings,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AtlasLogo } from "@/components/atlas/atlas-logo";
import { UserMenu } from "@/components/atlas/user-menu";
import { ChildPicker } from "@/components/atlas/child-picker";
import { useSession } from "@/hooks/use-session";
import { useUnreadCount } from "@/hooks/use-notifications";

interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { to: "/app", labelKey: "sidebar.dashboard", icon: LayoutDashboard },
  { to: "/app/crianca", labelKey: "sidebar.children", icon: Baby },
  { to: "/app/timeline", labelKey: "sidebar.timeline", icon: ListChecks },
  { to: "/app/calendario", labelKey: "sidebar.calendar", icon: CalendarDays },
  { to: "/app/rotinas", labelKey: "sidebar.routines", icon: Repeat },
  { to: "/app/medicacao", labelKey: "sidebar.medication", icon: Pill },
  { to: "/app/documentos", labelKey: "sidebar.documents", icon: FileText },
  { to: "/app/humor", labelKey: "sidebar.mood", icon: SmilePlus },
  { to: "/app/comportamento", labelKey: "sidebar.behavior", icon: Activity },
  { to: "/app/objetivos", labelKey: "sidebar.goals", icon: Target },
  { to: "/app/relatorios", labelKey: "sidebar.reports", icon: BarChart3 },
  { to: "/app/ia", labelKey: "sidebar.ai", icon: Sparkles },
  { to: "/app/notificacoes", labelKey: "sidebar.notifications", icon: Bell },
  { to: "/app/configuracoes", labelKey: "sidebar.settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation("app");
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { profile } = useSession();
  const { data: unreadCount = 0 } = useUnreadCount();

  return (
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-sidebar lg:flex lg:flex-col">
          <div className="px-6 py-5">
            <Link to="/" aria-label="ATLAS">
              <AtlasLogo />
            </Link>
          </div>
          <nav className="flex-1 space-y-0.5 px-3 pb-6">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === "/app"
                  ? location.pathname === "/app"
                  : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-soft text-primary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border/60 p-4">
            <div className="flex items-center gap-3">
              <UserMenu />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {profile?.fullName ?? "Família"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile?.email ?? ""}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar — desktop mostra o seletor de criança, mobile mostra logo + menu */}
          <div className="flex items-center justify-between border-b border-border/60 bg-background px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Link to="/" aria-label="Meu Mundo Azul" className="lg:hidden">
                <AtlasLogo />
              </Link>
              <div className="hidden lg:block">
                <ChildPicker />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="lg:hidden">
                <ChildPicker />
              </div>
              <Link
                to="/kid"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-110"
                title="Abrir Mundo Azul (modo criança)"
              >
                <span aria-hidden>💙</span>
                <span className="hidden sm:inline">Mundo Azul</span>
              </Link>
              <UserMenu />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu"
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {mobileOpen && (
            <nav className="border-b border-border/60 bg-background px-3 py-2 lg:hidden">
              <div className="grid grid-cols-2 gap-1">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
