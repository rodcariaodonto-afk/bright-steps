import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Bookmark, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLibraryArticle, toggleArticleSaved } from "@/modules/library/api.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/biblioteca/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} | Biblioteca Meu Mundo Azul` },
      { name: "description", content: "Artigo educativo sobre desenvolvimento infantil." },
    ],
  }),
  errorComponent: ({ error }) => (
    <>
      <p className="text-destructive">Erro ao carregar: {error.message}</p>
    </>
  ),
  notFoundComponent: () => (
    <>
      <p className="text-muted-foreground">Artigo não encontrado.</p>
    </>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const getFn = useServerFn(getLibraryArticle);
  const toggleFn = useServerFn(toggleArticleSaved);
  const qc = useQueryClient();
  const { data: article, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: () => getFn({ data: { slug } }),
  });
  const save = useMutation({
    mutationFn: () => toggleFn({ data: { articleId: article!.id } }),
    onSuccess: (r) => {
      toast.success(r.saved ? "Salvo na sua biblioteca" : "Removido dos salvos");
      qc.invalidateQueries({ queryKey: ["saved-articles"] });
    },
  });

  if (isLoading) return <><p className="text-muted-foreground">Carregando...</p></>;
  if (!article) throw notFound();

  return (
    <>
      <article className="max-w-3xl mx-auto space-y-6">
        <Link to="/app/biblioteca" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        {article.cover_url && (
          <img src={article.cover_url} alt="" className="w-full aspect-video object-cover rounded-xl" />
        )}
        <header className="space-y-3">
          {article.library_categories?.name && <Badge>{article.library_categories.name}</Badge>}
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">{article.title}</h1>
          {article.summary && <p className="text-lg text-muted-foreground">{article.summary}</p>}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {article.reading_minutes} min</span>
            {article.author_name && <span>Por {article.author_name}</span>}
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => save.mutate()} disabled={save.isPending}>
              <Bookmark className="h-4 w-4 mr-2" /> Salvar
            </Button>
          </div>
        </header>
        <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap">
          {article.body}
        </div>
      </article>
    </>
  );
}
