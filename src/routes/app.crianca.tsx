import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CloudOff } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PlaceholderProps {
  title: string;
}

function Placeholder({ title }: PlaceholderProps) {
  const { t } = useTranslation("app");
  return (
    <div className="p-6 lg:p-10">
      <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <CloudOff className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-foreground">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("placeholder.message")}
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/app">{t("placeholder.backToDashboard")}</Link>
        </Button>
      </div>
    </div>
  );
}

export const CriancaRoute = createFileRoute("/app/crianca")({
  component: () => <Placeholder title="Perfil da criança" />,
});
export const Route = CriancaRoute;
