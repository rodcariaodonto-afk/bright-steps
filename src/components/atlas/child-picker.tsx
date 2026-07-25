import { useNavigate } from "@tanstack/react-router";
import { Baby, ChevronDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveChild } from "@/hooks/use-active-child";

export function ChildPicker() {
  const { t } = useTranslation("app");
  const { activeChild, children, setActiveChildId } = useActiveChild();
  const navigate = useNavigate();

  if (children.length === 0) {
    return (
      <button
        type="button"
        onClick={() => navigate({ to: "/app/crianca" })}
        className="inline-flex items-center gap-2 rounded-full border border-dashed border-primary/40 bg-primary-soft/40 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-soft"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        {t("childPicker.addChild")}
      </button>
    );
  }

  const label = activeChild?.nickname ?? activeChild?.full_name ?? t("childPicker.select");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
        >
          {activeChild?.avatar_url ? (
            <img
              src={activeChild.avatar_url}
              alt=""
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Baby className="h-3 w-3" aria-hidden="true" />
            </span>
          )}
          <span className="max-w-[10rem] truncate">{label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs uppercase tracking-widest">
          {t("childPicker.activeChild")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children.map((c) => (
          <DropdownMenuItem key={c.id} onSelect={() => setActiveChildId(c.id)}>
            {c.avatar_url ? (
              <img
                src={c.avatar_url}
                alt=""
                className="mr-2 h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <Baby className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            <span className="flex-1 truncate">
              {c.nickname ?? c.full_name}
            </span>
            {c.id === activeChild?.id ? (
              <span className="ml-2 text-[10px] font-semibold text-primary">
                {t("childPicker.current")}
              </span>
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate({ to: "/app/crianca" })}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("childPicker.manageChildren")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
