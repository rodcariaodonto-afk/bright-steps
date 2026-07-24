import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BookOpen, Clock, Search } from "lucide-react";
import { AppShell } from "@/components/atlas/app-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listLibraryArticles, listLibraryCategories } from "@/modules/library/api.functions";

export const Route = createFileRoute("/app/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca educativa | Meu Mundo Azul" },
      { name: "description", content: "Artigos sobre alimentação, comunicação, sono, comportamento e bem-estar do cuidador." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | undefined>(undefined);
  const cats = useServerFn(listLibraryCategories);
  const arts = useServerFn(listLibraryArticles);
  const { data: categories = [] } = useQuery({ queryKey: ["library-cats"], queryFn: () => cats() });
  const { data: articles = [] } = useQuery({
    queryKey: ["library-arts", cat, q],
    queryFn: () => arts({ data: { categorySlug: cat, q: q || undefined } }),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-brand-primary">
            <BookOpen className="h-5 w-5" /> <span className="text-sm font-medium uppercase tracking-wide">Biblioteca</span>
          </div>
          <h1 className="text-3xl font-semibold">Conteúdos educativos</h1>
          <p className="text-muted-foreground max-w-2xl">
            Artigos práticos, escritos e revisados por profissionais, para apoiar a família no dia a dia.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar artigo..." className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCat(undefined)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${!cat ? "bg-brand-primary text-white border-brand-primary" : "border-border hover:bg-muted"}`}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.slug)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${cat === c.slug ? "bg-brand-primary text-white border-brand-primary" : "border-border hover:bg-muted"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {articles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Ainda não há artigos publicados nesta categoria. Nossa equipe editorial está preparando conteúdos.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                to="/app/biblioteca/$slug"
                params={{ slug: a.slug }}
                className="group"
              >
                <Card className="h-full transition hover:shadow-md hover:border-brand-primary/40">
                  {a.cover_url && (
                    <div className="aspect-video overflow-hidden rounded-t-xl">
                      <img src={a.cover_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    {a.library_categories?.name && (
                      <Badge variant="secondary" className="text-xs">{a.library_categories.name}</Badge>
                    )}
                    <h3 className="font-semibold leading-snug group-hover:text-brand-primary">{a.title}</h3>
                    {a.summary && <p className="text-sm text-muted-foreground line-clamp-3">{a.summary}</p>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <Clock className="h-3 w-3" /> {a.reading_minutes} min de leitura
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
