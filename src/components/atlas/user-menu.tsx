import { LogOut, Shield, Stethoscope, User as UserIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  variant?: "light" | "dark";
  showAdminLink?: boolean;
}

export function UserMenu({ variant = "light", showAdminLink }: UserMenuProps) {
  const { session, profile, roles, isAdmin, signOut } = useSession();
  const isProfessional = roles.includes("professional");
  const navigate = useNavigate();

  if (!session) {
    return (
      <Button
        size="sm"
        variant={variant === "dark" ? "secondary" : "default"}
        onClick={() => navigate({ to: "/auth" })}
      >
        Entrar
      </Button>
    );
  }

  const avatar = profile?.avatarUrl;
  const initials = profile?.initials ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu do usuário"
          className={cn(
            "flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-xs font-semibold outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            variant === "dark"
              ? "bg-background text-foreground"
              : "bg-primary text-primary-foreground",
          )}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={profile?.fullName ?? "Avatar"}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate text-sm font-semibold text-foreground">
              {profile?.fullName ?? "Usuário"}
            </span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {profile?.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate({ to: "/app/configuracoes" })}>
          <UserIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          Minha conta
        </DropdownMenuItem>
        {isProfessional || isAdmin ? (
          <DropdownMenuItem onSelect={() => navigate({ to: "/pro" })}>
            <Stethoscope className="mr-2 h-4 w-4" aria-hidden="true" />
            Área Clínica
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => navigate({ to: "/seja-profissional" })}>
            <Stethoscope className="mr-2 h-4 w-4" aria-hidden="true" />
            Sou profissional
          </DropdownMenuItem>
        )}
        {(showAdminLink ?? isAdmin) && isAdmin ? (
          <DropdownMenuItem onSelect={() => navigate({ to: "/admin" })}>
            <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
            Painel Admin
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await signOut();
            navigate({ to: "/auth", replace: true });
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
