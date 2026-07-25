import { createFileRoute } from "@tanstack/react-router";
import { ContentCrud } from "@/components/admin/content-crud";

export const Route = createFileRoute("/admin/missions")({
  component: () => (
    <ContentCrud
      title="Missões"
      description="Missões diárias e semanais para engajamento."
      table="content_missions"
      displayField="title"
      subtitleField="description"
      fields={[
        { name: "slug", label: "Slug", type: "text", required: true },
        { name: "title", label: "Título", type: "text", required: true },
        { name: "description", label: "Descrição", type: "textarea" },
        { name: "goal_type", label: "Tipo (routine/mood/game/story)", type: "text" },
        { name: "target_value", label: "Meta (quantidade)", type: "number", default: 1 },
        { name: "stars_reward", label: "Estrelas de recompensa", type: "number", default: 10 },
        { name: "audience", label: "Audiência (child/family)", type: "text", default: "child" },
        { name: "active", label: "Ativa", type: "boolean", default: true },
      ]}
    />
  ),
});
