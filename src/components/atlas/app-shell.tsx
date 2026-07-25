import { Link, useLocation } from "@tanstack/react-router";
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
  School,
  Trophy,
  Users,
  Store,
  MessageSquare,
  Settings,
  Menu,
  BookOpen,
  ClipboardCheck,
  HeartHandshake,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AtlasLogo } from "@/components/atlas/atlas-logo";
import { UserMenu } from "@/components/atlas/user-menu";
import { ChildPicker } from "@/components/atlas/child-picker";
import { LocaleSelector } from "@/components/i18n/locale-selector";
import { useSession } from "@/hooks/use-session";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { UpgradeCard } from "@/components/billing/upgrade-card";
import { ROUTE_FEATURE } from "@/modules/billing/entitlements";

interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
}

interface NavGroup {
  id: string;
  labelKey: string;
  items: NavItem[];
}

const PAINEL: NavItem = { to: "/app", labelKey: "sidebar.dashboard", icon: LayoutDashboard };
const AZUL_IA: NavItem = { to: "/app/ia", labelKey: "sidebar.ai", icon: Sparkles };

const GROUPS: NavGroup[] = [
  {
    id: "rotina",
    labelKey: "sidebar.groups.routine",
    items: [
      { to: "/app/timeline", labelKey: "sidebar.timeline", icon: ListChecks },
      { to: "/app/calendario", labelKey: "sidebar.calendar", icon: CalendarDays },
      { to: "/app/rotinas", labelKey: "sidebar.routines", icon: Repeat },
      { to: "/app/crianca", labelKey: "sidebar.children", icon: Baby },
    ],
  },
  {
    id: "saude",
    labelKey: "sidebar.groups.health",
    items: [
      { to: "/app/medicacao", labelKey: "sidebar.medication", icon: Pill },
      { to: "/app/humor", labelKey: "sidebar.mood", icon: SmilePlus },
      { to: "/app/comportamento", labelKey: "sidebar.behavior", icon: Activity },
      { to: "/app/documentos", labelKey: "sidebar.documents", icon: FileText },
    ],
  },
  {
    id: "desenvolvimento",
    labelKey: "sidebar.groups.development",
    items: [
      { to: "/app/objetivos", labelKey: "sidebar.goals", icon: Target },
      { to: "/app/relatorios", labelKey: "sidebar.reports", icon: BarChart3 },
      { to: "/app/autoavaliacoes", labelKey: "sidebar.assessments", icon: ClipboardCheck },
      { to: "/app/conquistas", labelKey: "sidebar.achievements", icon: Trophy },
      { to: "/app/biblioteca", labelKey: "sidebar.library", icon: BookOpen },
    ],
  },
  {
    id: "rede",
    labelKey: "sidebar.groups.network",
    items: [
      { to: "/app/escola", labelKey: "sidebar.school", icon: School },
      { to: "/app/cuidador", labelKey: "sidebar.caregiver", icon: HeartHandshake },
      { to: "/app/comunidade", labelKey: "sidebar.community", icon: Users },
      { to: "/app/marketplace", labelKey: "sidebar.marketplace", icon: Store },
      { to: "/app/mensagens", labelKey: "sidebar.messages", icon: MessageSquare },
    ],
  },
  {
    id: "conta",
    labelKey: "sidebar.groups.account",
    items: [
      { to: "/app/notificacoes", labelKey: "sidebar.notifications", icon: Bell },
      { to: "/app/assinatura", labelKey: "sidebar.subscription", icon: CreditCard },
      { to: "/app/configuracoes", labelKey: "sidebar.settings", icon: Settings },
    ],
  },
];

const GROUPS_STORAGE_KEY = "mma:sidebar:groups";

function isItemActive(pathname: string, to: string): boolean {
  if (to === "/app") return pathname === "/app";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function useOpenGroups(pathname: string) {
  const activeGroupId = useMemo(() => {
    for (const g of GROUPS) {
      if (g.items.some((it) => isItemActive(pathname, it.to))) return g.id;
    }
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
    const initial: Record<string, boolean> = {};
    GROUPS.forEach((g) => (initial[g.id] = g.id === "rotina"));
    return initial;
  });

  useEffect(() => {
    if (!activeGroupId) return;
    setOpenMap((prev) => (prev[activeGroupId] ? prev : { ...prev, [activeGroupId]: true }));
  }, [activeGroupId]);

  useEffect(() => {
    try {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(openMap));
    } catch {
      // ignore
    }
  }, [openMap]);

  const toggle = (id: string) => setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  return { openMap, toggle };
}

function NavLinkItem({
  item,
  onNavigate,
  unreadCount,
  active,
  label,
}: {
  item: NavItem;
  onNavigate?: () => void;
  unreadCount: number;
  active: boolean;
  label: string;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-soft text-primary"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      {item.to === "/app/notificacoes" && unreadCount > 0 && (
        <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

function SidebarNav({
  pathname,
  unreadCount,
  onNavigate,
}: {
  pathname: string;
  unreadCount: number;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation("app");
  const { openMap, toggle } = useOpenGroups(pathname);

  return (
    <nav className="flex-1 space-y-3 overflow-y-auto px-3 pb-6">
      <div className="space-y-0.5">
        <NavLinkItem
          item={PAINEL}
          active={isItemActive(pathname, PAINEL.to)}
          unreadCount={unreadCount}
          onNavigate={onNavigate}
          label={t(PAINEL.labelKey)}
        />
        <NavLinkItem
          item={AZUL_IA}
          active={isItemActive(pathname, AZUL_IA.to)}
          unreadCount={unreadCount}
          onNavigate={onNavigate}
          label={t(AZUL_IA.labelKey)}
        />
      </div>

      {GROUPS.map((group) => {
        const isOpen = openMap[group.id] ?? false;
        const hasActive = group.items.some((it) => isItemActive(pathname, it.to));
        return (
          <div key={group.id} className="space-y-1">
            <button
              type="button"
              onClick={() => toggle(group.id)}
              className={cn(
                "group flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition",
                hasActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              aria-expanded={isOpen}
            >
              <span>{t(group.labelKey)}</span>
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
                {group.items.map((item) => (
                  <NavLinkItem
                    key={item.to}
                    item={item}
                    active={isItemActive(pathname, item.to)}
                    unreadCount={unreadCount}
                    onNavigate={onNavigate}
                    label={t(item.labelKey)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { profile, session } = useSession();
  const { t } = useTranslation("app");
  const { data: unreadCount = 0 } = useUnreadCount();
  const { hasFeature, loading: subLoading } = useSubscription(session?.user?.id);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const requiredFeature = Object.entries(ROUTE_FEATURE).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`),
  )?.[1];
  const isLocked = !!requiredFeature && !subLoading && !hasFeature(requiredFeature);

  return (
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar lg:flex">
          <div className="px-6 py-5">
            <Link to="/" aria-label="Meu Mundo Azul">
              <AtlasLogo />
            </Link>
          </div>
          <SidebarNav pathname={location.pathname} unreadCount={unreadCount} />
          <div className="border-t border-border/60 p-4">
            <div className="flex items-center gap-3">
              <UserMenu />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {profile?.fullName ?? t("shell.familyFallback")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile?.email ?? ""}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border/60 px-5 py-4">
              <SheetTitle asChild>
                <Link to="/" aria-label="Meu Mundo Azul" onClick={() => setMobileOpen(false)}>
                  <AtlasLogo />
                </Link>
              </SheetTitle>
            </SheetHeader>
            <div className="flex h-[calc(100dvh-4rem)] flex-col">
              <SidebarNav
                pathname={location.pathname}
                unreadCount={unreadCount}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 bg-background px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("shell.openMenu")}
                onClick={() => setMobileOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
              <Link to="/" aria-label="Meu Mundo Azul" className="lg:hidden">
                <AtlasLogo showWordmark={false} />
              </Link>
            </div>

            <div className="flex min-w-0 justify-start lg:justify-start">
              <ChildPicker />
            </div>

            <div className="flex items-center gap-2">
              <LocaleSelector variant="compact" align="end" />
              <UserMenu />
            </div>
          </div>

          <SubscriptionBanner />
          <main className="flex-1">
            {isLocked && requiredFeature ? (
              <div className="p-6">
                <UpgradeCard feature={requiredFeature} />
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </div>
  );
}