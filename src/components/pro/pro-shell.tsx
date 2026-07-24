import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ListChecks,
  Target,
  Ruler,
  FileText,
  FolderOpen,
  MessagesSquare,
  School,
  BarChart3,
  Sparkles,
  Settings,
  Search,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProLogo } from "@/components/pro/pro-logo";
import { UserMenu } from "@/components/atlas/user-menu";

interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
}

interface NavSection {
  labelKey: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    labelKey: "sidebar.sections.work",
    items: [
      { to: "/pro", labelKey: "sidebar.dashboard", icon: LayoutDashboard },
      { to: "/pro/agenda", labelKey: "sidebar.agenda", icon: CalendarDays },
      { to: "/pro/pacientes", labelKey: "sidebar.patients", icon: Users },
    ],
  },
  {
    labelKey: "sidebar.sections.clinical",
    items: [
      { to: "/pro/evolucao", labelKey: "sidebar.evolution", icon: ListChecks },
      { to: "/pro/objetivos", labelKey: "sidebar.goals", icon: Target },
      { to: "/pro/escalas", labelKey: "sidebar.scales", icon: Ruler },
      { to: "/pro/relatorios", labelKey: "sidebar.reports", icon: FileText },
      { to: "/pro/indicadores", labelKey: "sidebar.indicators", icon: BarChart3 },
    ],
  },
  {
    labelKey: "sidebar.sections.collaboration",
    items: [
      { to: "/pro/mensagens", labelKey: "sidebar.messages", icon: MessagesSquare },
      { to: "/pro/escola", labelKey: "sidebar.school", icon: School },
      { to: "/pro/documentos", labelKey: "sidebar.documents", icon: FolderOpen },
      { to: "/pro/ia", labelKey: "sidebar.ai", icon: Sparkles },
    ],
  },
  {
    labelKey: "sidebar.sections.settings",
    items: [
      { to: "/pro/configuracoes", labelKey: "sidebar.settings", icon: Settings },
    ],
  },
];

export function ProShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation("pro");
  const location = useLocation();

  // Aplica variante clínica ao subtree /pro/*
  useEffect(() => {
    document.body.classList.add("pro-scope");
    return () => document.body.classList.remove("pro-scope");
  }, []);

  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
          <div className="px-4 py-4">
            <Link to="/pro" aria-label="ATLAS Clínico">
              <ProLogo />
            </Link>
          </div>
          <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
            {NAV.map((section) => (
              <div key={section.labelKey}>
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
                  {t(section.labelKey)}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.to === "/pro"
                        ? location.pathname === "/pro"
                        : location.pathname.startsWith(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {t(item.labelKey)}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-sidebar-border p-3">
            <Link
              to="/pro/sessoes/nova"
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t("sidebar.newSession")}
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-border/60 bg-background px-4 py-2.5">
            <div className="flex flex-1 items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
              <Search className="h-4 w-4" aria-hidden="true" />
              <input
                type="search"
                placeholder={t("topbar.search")}
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
                onFocus={() => setPaletteOpen(true)}
                readOnly
              />
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {t("topbar.shortcut")}
              </kbd>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app">Família</Link>
              </Button>
              <UserMenu />
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>

      {paletteOpen && (
        <button
          type="button"
          aria-label="Fechar busca"
          onClick={() => setPaletteOpen(false)}
          className="fixed inset-0 z-40 bg-black/40"
        >
          <div className="pointer-events-none absolute left-1/2 top-24 w-full max-w-lg -translate-x-1/2 rounded-xl border border-border bg-card p-4 text-left text-sm text-muted-foreground shadow-2xl">
            {t("topbar.search")}. A busca global entra na Onda 2 (com Cloud ativo).
          </div>
        </button>
      )}
    </div>
  );
}
