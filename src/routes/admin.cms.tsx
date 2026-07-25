import { createFileRoute } from "@tanstack/react-router";
import { ContentCrud } from "@/components/admin/content-crud";

export const Route = createFileRoute("/admin/cms")({
  component: () => (
    <ContentCrud
      title="Biblioteca (Artigos)"
      description="Gerencie artigos publicados na biblioteca de conteúdo."
      table="library_articles"
      displayField="title"
      subtitleField="summary"
      fields={[
        { name: "slug", label: "Slug", type: "text", required: true, placeholder: "ex: entendendo-tea" },
        { name: "title", label: "Título", type: "text", required: true },
        { name: "summary", label: "Resumo", type: "textarea" },
        { name: "body", label: "Conteúdo (Markdown)", type: "textarea", required: true },
        { name: "cover_url", label: "URL da capa", type: "text" },
        { name: "author_name", label: "Autor", type: "text" },
        { name: "reading_minutes", label: "Tempo de leitura (min)", type: "number", default: 5 },
        { name: "audience", label: "Audiência (family/pro/all)", type: "text", default: "all" },
        { name: "tags", label: "Tags (separadas por vírgula)", type: "tags" },
      ]}
    />
  ),
});
