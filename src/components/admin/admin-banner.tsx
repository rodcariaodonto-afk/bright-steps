import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";

export function AdminBanner() {
  const { t } = useTranslation("admin");
  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-[11px] text-amber-900 dark:text-amber-200">
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{t("banner.message")}</span>
      </div>
    </div>
  );
}
