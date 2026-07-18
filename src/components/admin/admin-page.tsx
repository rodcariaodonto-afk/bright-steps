import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CloudOff } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface AdminPageProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function AdminPage({ title, description, children }: AdminPageProps) {
  const { t } = useTranslation("admin");
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children ?? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <CloudOff className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            {t("placeholder.message")}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <Link to="/admin">{t("placeholder.back")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
