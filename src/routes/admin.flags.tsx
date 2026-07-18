import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AdminPage } from "@/components/admin/admin-page";

export const Route = createFileRoute("/admin/flags")({
  component: () => {
    const { t } = useTranslation("admin");
    return <AdminPage title={t("sidebar.flags")} />;
  },
});
