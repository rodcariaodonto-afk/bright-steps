import { useMutation } from "@tanstack/react-query";
import { Check, Globe, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { changeLocale } from "@/i18n";
import { LOCALES, SUPPORTED_LOCALES, type LocaleCode } from "@/i18n/config";
import { persistLocaleLocal } from "@/i18n/detector";
import { useLocale } from "@/i18n/hooks";
import { updateProfileLocale } from "@/modules/profile/locale.functions";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LocaleSelectorProps {
  /** "icon" = só bandeira/globe. "compact" = bandeira + código. "full" = tudo. */
  variant?: "icon" | "compact" | "full";
  align?: "start" | "center" | "end";
  className?: string;
}

/**
 * Seletor de idioma global. Persiste em localStorage sempre e,
 * quando há sessão, também no perfil (profiles.locale).
 */
export function LocaleSelector({
  variant = "compact",
  align = "end",
  className,
}: LocaleSelectorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={variant === "icon" ? "icon" : "sm"}
        className={cn("gap-2", className)}
        aria-label="Selecionar idioma"
        disabled
      >
        <span className="text-base leading-none">🌐</span>
        {variant === "compact" && (
          <span className="text-xs font-medium uppercase">PT</span>
        )}
        {variant === "full" && (
          <>
            <span className="text-sm">Idioma</span>
            <Globe className="h-3 w-3 opacity-60" />
          </>
        )}
      </Button>
    );
  }

  return <MountedLocaleSelector variant={variant} align={align} className={className} />;
}

function MountedLocaleSelector({
  variant = "compact",
  align = "end",
  className,
}: LocaleSelectorProps) {
  const { t } = useTranslation("common");
  const { locale, meta } = useLocale();
  const { session } = useSession();

  const items = useMemo(
    () => SUPPORTED_LOCALES.map((code) => LOCALES[code]),
    [],
  );

  const mutation = useMutation({
    mutationFn: async (next: LocaleCode) => {
      persistLocaleLocal(next);
      await changeLocale(next);
      if (session?.user) {
        try {
          await updateProfileLocale({ data: { locale: next } });
        } catch (err) {
          console.warn("[locale] Falha ao salvar no perfil", err);
        }
      }
      return next;
    },
    onSuccess: (next) => {
      toast.success(`${LOCALES[next].flag} ${LOCALES[next].nativeName}`);
    },
    onError: () => {
      toast.error("Não foi possível trocar o idioma.");
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "icon" ? "icon" : "sm"}
          className={cn("gap-2", className)}
          aria-label={t("language.select")}
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="text-base leading-none">{meta.flag}</span>
          )}
          {variant === "compact" && (
            <span className="text-xs font-medium uppercase">{meta.code}</span>
          )}
          {variant === "full" && (
            <>
              <span className="text-sm">{meta.nativeName}</span>
              <Globe className="h-3 w-3 opacity-60" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="max-h-96 w-56 overflow-y-auto">
        <DropdownMenuLabel>{t("language.label")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => {
          const active = item.code === locale;
          return (
            <DropdownMenuItem
              key={item.code}
              disabled={mutation.isPending}
              onSelect={(e) => {
                e.preventDefault();
                if (!active) mutation.mutate(item.code);
              }}
              className="flex items-center gap-2"
            >
              <span className="text-base leading-none">{item.flag}</span>
              <span className="flex-1 text-sm">{item.nativeName}</span>
              {active && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
