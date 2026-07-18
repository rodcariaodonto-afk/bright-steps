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
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AdminLogo } from "@/components/admin/admin-logo";
import { AdminBanner } from "@/components/admin/admin-banner";

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
    labelKey: "sidebar.sections.overview",
    items: [
      { to: "/admin", labelKey: "sidebar.dashboard", icon: LayoutDashboard },
      { to: "/admin/analytics", labelKey: "sidebar.analytics", icon: BarChart3 },
      { to: "/admin/reports", labelKey: "sidebar.reports", icon: FileText },
    ],
  },
  {
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
    labelKey: "sidebar.sections.operations",
    items: [
      { to: "/admin/notifications", labelKey: "sidebar.notifications", icon: Bell },
      { to: "/admin/ai", labelKey: "sidebar.ai", icon: Sparkles },
      { to: "/admin/logs", labelKey: "sidebar.logs", icon: ScrollText },
    ],
  },
  {
    labelKey: "sidebar.sections.settings",
    items: [
      { to: "/admin/flags", labelKey: "sidebar.flags", icon: Flag },
      { to: "/admin/permissions", labelKey: "sidebar.permissions", icon: Lock },
      { to: "/admin/backups", labelKey: "sidebar.backups", icon: Database },
      { to: "/admin/settings", labelKey: "sidebar.settings_global", icon: Settings },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation("admin");
  const location = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <AdminBanner />
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border/60 bg-background lg:flex">
          <div className="px-4 py-4">
            <Link to="/admin" aria-label="ATLAS Admin">
              <AdminLogo />
            </Link>
          </div>
          <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
            {NAV.map((section) => (
              <div key={section.labelKey}>
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {t(section.labelKey)}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.to === "/admin"
                        ? location.pathname === "/admin"
                        : location.pathname.startsWith(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                          isActive
                            ? "bg-foreground text-background"
                            : "text-foreground/80 hover:bg-muted",
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
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border/60 bg-background px-4 py-2.5">
            <p className="text-sm font-semibold text-foreground">{t("topbar.title")}</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app">{t("topbar.backToFamily")}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/pro">{t("topbar.backToPro")}</Link>
              </Button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                RC
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
