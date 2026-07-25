import { createFileRoute } from "@tanstack/react-router";
import { ContentCrud } from "@/components/admin/content-crud";

export const Route = createFileRoute("/admin/stories")({
  component: () => (
    <ContentCrud
      title="Histórias Interativas"
      description="Cadastre histórias exibidas no Módulo Criança."
      table="content_stories"
      displayField="title"
      subtitleField="summary"
      fields={[
        { name: "slug", label: "Slug", type: "text", required: true },
        { name: "title", label: "Título", type: "text", required: true },
        { name: "summary", label: "Resumo", type: "textarea" },
        { name: "body", label: "Roteiro / conteúdo", type: "textarea" },
        { name: "cover_url", label: "URL da capa", type: "text" },
        { name: "age_min", label: "Idade mínima", type: "number", default: 3 },
        { name: "age_max", label: "Idade máxima", type: "number", default: 12 },
        { name: "tags", label: "Tags", type: "tags" },
        { name: "published", label: "Publicada", type: "boolean", default: true },
      ]}
    />
  ),
});
