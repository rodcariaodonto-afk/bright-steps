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

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AtlasLogo } from "@/components/atlas/atlas-logo";
import { UserMenu } from "@/components/atlas/user-menu";
import { ChildPicker } from "@/components/atlas/child-picker";
import { useSession } from "@/hooks/use-session";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { UpgradeCard } from "@/components/billing/upgrade-card";
import { ROUTE_FEATURE } from "@/modules/billing/entitlements";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const PAINEL: NavItem = { to: "/app", label: "Painel", icon: LayoutDashboard };
const AZUL_IA: NavItem = { to: "/app/ia", label: "Azul IA", icon: Sparkles };

const GROUPS: NavGroup[] = [
  {
    id: "rotina",
    label: "Rotina & dia a dia",
    items: [
      { to: "/app/timeline", label: "Linha do tempo", icon: ListChecks },
      { to: "/app/calendario", label: "Calendário", icon: CalendarDays },
      { to: "/app/rotinas", label: "Rotinas", icon: Repeat },
      { to: "/app/crianca", label: "Crianças", icon: Baby },
    ],
  },
  {
    id: "saude",
    label: "Saúde",
    items: [
      { to: "/app/medicacao", label: "Medicação", icon: Pill },
      { to: "/app/humor", label: "Humor", icon: SmilePlus },
      { to: "/app/comportamento", label: "Comportamento", icon: Activity },
      { to: "/app/documentos", label: "Documentos", icon: FileText },
    ],
  },
  {
    id: "desenvolvimento",
    label: "Desenvolvimento",
    items: [
      { to: "/app/objetivos", label: "Objetivos", icon: Target },
      { to: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
      { to: "/app/autoavaliacoes", label: "Autoavaliações", icon: ClipboardCheck },
      { to: "/app/conquistas", label: "Conquistas", icon: Trophy },
      { to: "/app/biblioteca", label: "Biblioteca", icon: BookOpen },
    ],
  },
  {
    id: "rede",
    label: "Rede de apoio",
    items: [
      { to: "/app/escola", label: "Escola", icon: School },
      { to: "/app/cuidador", label: "Bem estar", icon: HeartHandshake },
      { to: "/app/comunidade", label: "Comunidade", icon: Users },
      { to: "/app/marketplace", label: "Marketplace", icon: Store },
      { to: "/app/mensagens", label: "Mensagens", icon: MessageSquare },
    ],
  },
  {
    id: "conta",
    label: "Conta",
    items: [
      { to: "/app/notificacoes", label: "Notificações", icon: Bell },
      { to: "/app/assinatura", label: "Assinatura", icon: CreditCard },
      { to: "/app/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

const GROUPS_STORAGE_KEY = "mma:sidebar:groups";

function isItemActive(pathname: string, to: string): boolean {
  if (to === "/app") return pathname === "/app";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function useOpenGroups(pathname: string) {
  // Determine which group contains the active route
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
    // default: all closed except the active group and "rotina"
    const initial: Record<string, boolean> = {};
    GROUPS.forEach((g) => (initial[g.id] = g.id === "rotina"));
    return initial;
  });

  // Ensure the group containing the active route is open
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
}: {
  item: NavItem;
  onNavigate?: () => void;
  unreadCount: number;
  active: boolean;
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
        <span className="truncate">{item.label}</span>
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
  const { openMap, toggle } = useOpenGroups(pathname);

  return (
    <nav className="flex-1 space-y-3 overflow-y-auto px-3 pb-6">
      {/* Itens de destaque, fora de grupo */}
      <div className="space-y-0.5">
        <NavLinkItem
          item={PAINEL}
          active={isItemActive(pathname, PAINEL.to)}
          unreadCount={unreadCount}
          onNavigate={onNavigate}
        />
        <NavLinkItem
          item={AZUL_IA}
          active={isItemActive(pathname, AZUL_IA.to)}
          unreadCount={unreadCount}
          onNavigate={onNavigate}
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
              <span>{group.label}</span>
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
  const { data: unreadCount = 0 } = useUnreadCount();
  const { hasFeature, loading: subLoading } = useSubscription(session?.user?.id);

  // Fecha o drawer ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Gate por rota
  const requiredFeature = Object.entries(ROUTE_FEATURE).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`),
  )?.[1];
  const isLocked = !!requiredFeature && !subLoading && !hasFeature(requiredFeature);

  return (
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <div className="flex flex-1">
        {/* Sidebar desktop */}
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
                  {profile?.fullName ?? "Família"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile?.email ?? ""}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Drawer mobile */}
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
          {/* Topbar */}
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 bg-background px-4 py-2.5">
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
              <Link to="/" aria-label="Meu Mundo Azul" className="lg:hidden">
                <AtlasLogo showWordmark={false} />
              </Link>
            </div>

            {/* ChildPicker promovido — elemento central */}
            <div className="flex min-w-0 justify-start lg:justify-start">
              <ChildPicker />
            </div>

            <div className="flex items-center gap-2">
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
