import { createFileRoute } from "@tanstack/react-router";
import { ContentCrud } from "@/components/admin/content-crud";

export const Route = createFileRoute("/admin/games")({
  component: () => (
    <ContentCrud
      title="Jogos"
      description="Catálogo de jogos disponíveis para as crianças."
      table="content_games"
      displayField="title"
      subtitleField="description"
      fields={[
        { name: "slug", label: "Slug", type: "text", required: true },
        { name: "title", label: "Título", type: "text", required: true },
        { name: "description", label: "Descrição", type: "textarea" },
        { name: "category", label: "Categoria", type: "text" },
        { name: "difficulty", label: "Dificuldade (easy/medium/hard)", type: "text", default: "easy" },
        { name: "cover_url", label: "URL da capa", type: "text" },
        { name: "stars_reward", label: "Estrelas por conclusão", type: "number", default: 5 },
        { name: "published", label: "Publicado", type: "boolean", default: true },
      ]}
    />
  ),
});
