import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import { ProPage, ProCard } from "@/components/pro/pro-page";
import { cn } from "@/lib/utils";

const AUDIENCES = ["family", "school", "professionals"] as const;

export const Route = createFileRoute("/pro/mensagens")({
  component: MessagesPage,
});

function MessagesPage() {
  const { t } = useTranslation("pro");
  const [tab, setTab] = useState<(typeof AUDIENCES)[number]>("family");
  return (
    <ProPage title={t("messages.title")} subtitle={t("messages.subtitle")}>
      <nav className="flex gap-1 rounded-lg border border-border/60 bg-card p-1">
        {AUDIENCES.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setTab(a)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium",
              tab === a
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t(`messages.audiences.${a}`)}
          </button>
        ))}
      </nav>
      <ProCard>
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
          As threads seguras entram na Onda 4, organizadas por criança.
        </div>
      </ProCard>
    </ProPage>
  );
}
