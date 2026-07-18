import { CloudOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ProPreviewBanner() {
  const { t } = useTranslation("pro");
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-warning/40 bg-warning/15 px-4 py-1.5 text-center text-[11px] font-medium text-warning-foreground"
    >
      <CloudOff aria-hidden="true" className="h-3 w-3" />
      <span>{t("banner.previewMode")}</span>
    </div>
  );
}
