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
  UserCircle,
  Plus,
  Menu,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProLogo } from "@/components/pro/pro-logo";
import { UserMenu } from "@/components/atlas/user-menu";
import { useSession } from "@/hooks/use-session";
import { useSubscription } from "@/hooks/use-subscription";
import { UpgradeCard } from "@/components/billing/upgrade-card";

interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
}

interface NavSection {
  id: string;
  labelKey: string;
  items: NavItem[];
}

const DASHBOARD: NavItem = { to: "/pro", labelKey: "sidebar.dashboard", icon: LayoutDashboard };

const NAV: NavSection[] = [
  {
    id: "work",
    labelKey: "sidebar.sections.work",
    items: [
      { to: "/pro/agenda", labelKey: "sidebar.agenda", icon: CalendarDays },
      { to: "/pro/pacientes", labelKey: "sidebar.patients", icon: Users },
    ],
  },
  {
    id: "clinical",
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
    id: "collab",
    labelKey: "sidebar.sections.collaboration",
    items: [
      { to: "/pro/mensagens", labelKey: "sidebar.messages", icon: MessagesSquare },
      { to: "/pro/escola", labelKey: "sidebar.school", icon: School },
      { to: "/pro/documentos", labelKey: "sidebar.documents", icon: FolderOpen },
      { to: "/pro/ia", labelKey: "sidebar.ai", icon: Sparkles },
    ],
  },
  {
    id: "settings",
    labelKey: "sidebar.sections.settings",
    items: [
      { to: "/pro/perfil", labelKey: "sidebar.profile", icon: UserCircle },
      { to: "/pro/configuracoes", labelKey: "sidebar.settings", icon: Settings },
    ],
  },
];

const GROUPS_STORAGE_KEY = "mma:pro:sidebar:groups";

function isItemActive(pathname: string, to: string): boolean {
  if (to === "/pro") return pathname === "/pro";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function useOpenGroups(pathname: string) {
  const activeId = useMemo(() => {
    for (const g of NAV) if (g.items.some((it) => isItemActive(pathname, it.to))) return g.id;
    return null;
  }, [pathname]);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      // ignore
    }
    const init: Record<string, boolean> = {};
    NAV.forEach((g) => (init[g.id] = g.id === "work" || g.id === "clinical"));
    return init;
  });

  useEffect(() => {
    if (!activeId) return;
    setOpenMap((prev) => (prev[activeId] ? prev : { ...prev, [activeId]: true }));
  }, [activeId]);

  useEffect(() => {
    try {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(openMap));
    } catch {
      // ignore
    }
  }, [openMap]);

  return { openMap, toggle: (id: string) => setOpenMap((p) => ({ ...p, [id]: !p[id] })) };
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation("pro");
  const { openMap, toggle } = useOpenGroups(pathname);

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
    );

  const DashIcon = DASHBOARD.icon;

  return (
    <nav className="flex-1 space-y-3 overflow-y-auto px-2 pb-4">
      <div className="space-y-0.5">
        <Link
          to={DASHBOARD.to}
          onClick={onNavigate}
          className={linkClass(isItemActive(pathname, DASHBOARD.to))}
        >
          <DashIcon className="h-4 w-4" aria-hidden="true" />
          {t(DASHBOARD.labelKey)}
        </Link>
      </div>

      {NAV.map((section) => {
        const isOpen = openMap[section.id] ?? false;
        const hasActive = section.items.some((it) => isItemActive(pathname, it.to));
        return (
          <div key={section.id} className="space-y-1">
            <button
              type="button"
              onClick={() => toggle(section.id)}
              aria-expanded={isOpen}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition",
                hasActive
                  ? "text-sidebar-foreground"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground",
              )}
            >
              <span>{t(section.labelKey)}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 opacity-60 transition-transform",
                  isOpen ? "rotate-0" : "-rotate-90",
                )}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onNavigate}
                      className={linkClass(isItemActive(pathname, item.to))}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function ProShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation("pro");
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("pro-scope");
    return () => document.body.classList.remove("pro-scope");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
          <SidebarNav pathname={location.pathname} />
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

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
            <SheetHeader className="border-b border-sidebar-border px-4 py-4">
              <SheetTitle asChild>
                <Link to="/pro" aria-label="ATLAS Clínico" onClick={() => setMobileOpen(false)}>
                  <ProLogo />
                </Link>
              </SheetTitle>
            </SheetHeader>
            <div className="flex h-[calc(100dvh-4rem)] flex-col">
              <SidebarNav
                pathname={location.pathname}
                onNavigate={() => setMobileOpen(false)}
              />
              <div className="border-t border-sidebar-border p-3">
                <Link
                  to="/pro/sessoes/nova"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("sidebar.newSession")}
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-border/60 bg-background px-4 py-2.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir menu"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <div className="flex flex-1 items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
              <Search className="h-4 w-4" aria-hidden="true" />
              <input
                type="search"
                placeholder={t("topbar.search")}
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
                onFocus={() => setPaletteOpen(true)}
                readOnly
              />
              <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
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

          <main className="flex-1">
            <ProSubscriptionGate>{children}</ProSubscriptionGate>
          </main>
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

function ProSubscriptionGate({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { loading, hasFeature } = useSubscription(session?.user?.id);
  if (loading) return <>{children}</>;
  if (hasFeature("clinical_module")) return <>{children}</>;
  return (
    <div className="p-6">
      <UpgradeCard
        feature="clinical_module"
        reason="Para acessar o Painel Clínico você precisa do plano Profissional Clínica. 7 dias grátis, cancele quando quiser."
      />
    </div>
  );
}
