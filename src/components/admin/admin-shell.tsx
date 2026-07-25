import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  Home,
  Baby,
  Stethoscope,
  School,
  FileText,
  Gamepad2,
  Trophy,
  Target,
  ShoppingBag,
  MessageSquare,
  CreditCard,
  DollarSign,
  Ticket,
  Bell,
  BarChart3,
  Sparkles,
  ScrollText,
  Flag,
  Lock,
  Database,
  Settings,
  BookOpen,
  Menu,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AdminLogo } from "@/components/admin/admin-logo";
import { UserMenu } from "@/components/atlas/user-menu";

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

const DASHBOARD: NavItem = { to: "/admin", labelKey: "sidebar.dashboard", icon: LayoutDashboard };

const NAV: NavSection[] = [
  {
    id: "overview",
    labelKey: "sidebar.sections.overview",
    items: [
      { to: "/admin/analytics", labelKey: "sidebar.analytics", icon: BarChart3 },
      { to: "/admin/reports", labelKey: "sidebar.reports", icon: FileText },
    ],
  },
  {
    id: "people",
    labelKey: "sidebar.sections.people",
    items: [
      { to: "/admin/users", labelKey: "sidebar.users", icon: Users },
      { to: "/admin/families", labelKey: "sidebar.families", icon: Home },
      { to: "/admin/children", labelKey: "sidebar.children", icon: Baby },
      { to: "/admin/professionals", labelKey: "sidebar.professionals", icon: Stethoscope },
      { to: "/admin/schools", labelKey: "sidebar.schools", icon: School },
    ],
  },
  {
    id: "content",
    labelKey: "sidebar.sections.content",
    items: [
      { to: "/admin/cms", labelKey: "sidebar.cms", icon: BookOpen },
      { to: "/admin/stories", labelKey: "sidebar.stories", icon: BookOpen },
      { to: "/admin/games", labelKey: "sidebar.games", icon: Gamepad2 },
      { to: "/admin/missions", labelKey: "sidebar.missions", icon: Target },
      { to: "/admin/achievements", labelKey: "sidebar.achievements", icon: Trophy },
    ],
  },
  {
    id: "commerce",
    labelKey: "sidebar.sections.commerce",
    items: [
      { to: "/admin/marketplace", labelKey: "sidebar.marketplace", icon: ShoppingBag },
      { to: "/admin/community", labelKey: "sidebar.community", icon: MessageSquare },
      { to: "/admin/subscriptions", labelKey: "sidebar.subscriptions", icon: CreditCard },
      { to: "/admin/finance", labelKey: "sidebar.finance", icon: DollarSign },
      { to: "/admin/coupons", labelKey: "sidebar.coupons", icon: Ticket },
    ],
  },
  {
    id: "operations",
    labelKey: "sidebar.sections.operations",
    items: [
      { to: "/admin/notifications", labelKey: "sidebar.notifications", icon: Bell },
      { to: "/admin/ai", labelKey: "sidebar.ai", icon: Sparkles },
      { to: "/admin/logs", labelKey: "sidebar.logs", icon: ScrollText },
    ],
  },
  {
    id: "settings",
    labelKey: "sidebar.sections.settings",
    items: [
      { to: "/admin/flags", labelKey: "sidebar.flags", icon: Flag },
      { to: "/admin/permissions", labelKey: "sidebar.permissions", icon: Lock },
      { to: "/admin/backups", labelKey: "sidebar.backups", icon: Database },
      { to: "/admin/settings", labelKey: "sidebar.settings_global", icon: Settings },
    ],
  },
];

const GROUPS_STORAGE_KEY = "mma:admin:sidebar:groups";

function isItemActive(pathname: string, to: string): boolean {
  if (to === "/admin") return pathname === "/admin";
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
    NAV.forEach((g) => (init[g.id] = g.id === "overview" || g.id === "people"));
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
  const { t } = useTranslation("admin");
  const { openMap, toggle } = useOpenGroups(pathname);

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
      active ? "bg-foreground text-background" : "text-foreground/80 hover:bg-muted",
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
                hasActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
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

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation("admin");
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border/60 bg-background lg:flex">
          <div className="px-4 py-4">
            <Link to="/admin" aria-label="ATLAS Admin">
              <AdminLogo />
            </Link>
          </div>
          <SidebarNav pathname={location.pathname} />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border/60 px-4 py-4">
              <SheetTitle asChild>
                <Link to="/admin" aria-label="ATLAS Admin" onClick={() => setMobileOpen(false)}>
                  <AdminLogo />
                </Link>
              </SheetTitle>
            </SheetHeader>
            <div className="flex h-[calc(100dvh-4rem)] flex-col">
              <SidebarNav
                pathname={location.pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border/60 bg-background px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
              <p className="text-sm font-semibold text-foreground">{t("topbar.title")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app">{t("topbar.backToFamily")}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/pro">{t("topbar.backToPro")}</Link>
              </Button>
              <UserMenu variant="dark" />
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
