import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/atlas/placeholder-page";

export const Route = createFileRoute("/app/crianca")({
  component: () => <PlaceholderPage title="Perfil da criança" />,
});
