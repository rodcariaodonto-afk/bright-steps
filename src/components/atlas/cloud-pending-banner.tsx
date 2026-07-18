import { CloudOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CloudPendingBanner() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-warning/40 bg-warning/15 px-4 py-2 text-center text-xs font-medium text-warning-foreground"
    >
      <CloudOff aria-hidden="true" className="h-3.5 w-3.5" />
      <span>{t("common:banner.cloudPending")}</span>
    </div>
  );
}
