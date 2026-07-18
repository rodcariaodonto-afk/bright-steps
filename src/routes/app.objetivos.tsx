import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/atlas/placeholder-page";

export const Route = createFileRoute("/app/objetivos")({
  component: () => <PlaceholderPage title="Objetivos" />,
});
