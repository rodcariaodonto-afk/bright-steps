import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/atlas/placeholder-page";

export const Route = createFileRoute("/app/rotinas")({
  component: () => <PlaceholderPage title="Rotinas" />,
});
