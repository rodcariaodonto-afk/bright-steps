import { createFileRoute } from "@tanstack/react-router";
import { ContentCrud } from "@/components/admin/content-crud";

export const Route = createFileRoute("/admin/achievements")({
  component: () => (
    <ContentCrud
      title="Conquistas"
      description="Definições de conquistas desbloqueáveis."
      table="achievement_definitions"
      displayField="title"
      subtitleField="description"
      fields={[
        { name: "code", label: "Código único", type: "text", required: true, placeholder: "ex: first_routine" },
        { name: "title", label: "Título", type: "text", required: true },
        { name: "description", label: "Descrição", type: "textarea" },
        { name: "icon", label: "Ícone (lucide)", type: "text", default: "trophy" },
        { name: "category", label: "Categoria", type: "text" },
        { name: "stars_reward", label: "Estrelas de recompensa", type: "number", default: 20 },
        { name: "active", label: "Ativa", type: "boolean", default: true },
      ]}
    />
  ),
});
