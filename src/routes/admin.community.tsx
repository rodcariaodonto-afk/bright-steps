import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { EyeOff, Trash2, CheckCircle2, MessageSquare, Heart, FileText } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listCommunityPosts,
  moderateCommunityPost,
} from "@/modules/admin/commerce.functions";

export const Route = createFileRoute("/admin/community")({
  component: AdminCommunity,
});

function AdminCommunity() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const listFn = useServerFn(listCommunityPosts);
  const moderateFn = useServerFn(moderateCommunityPost);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "community", status, search],
    queryFn: () => listFn({ data: { status, search } }),
  });

  const moderate = useMutation({
    mutationFn: (input: { id: string; action: "hide" | "publish" | "delete" }) =>
      moderateFn({ data: input }),
    onSuccess: (_r, v) => {
      toast.success(
        v.action === "delete" ? "Post removido." : v.action === "hide" ? "Post ocultado." : "Post publicado.",
      );
      qc.invalidateQueries({ queryKey: ["admin", "community"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const m = data?.metrics ?? { postsToday: 0, commentsToday: 0, totalPosts: 0 };

  return (
    <AdminPage
      title="Comunidade"
      description="Modere posts públicos, comentários e status de publicação."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Posts hoje", value: m.postsToday, icon: FileText },
          { label: "Comentários hoje", value: m.commentsToday, icon: MessageSquare },
          { label: "Total posts", value: m.totalPosts, icon: Heart },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-border/60 bg-background p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </p>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="hidden">Ocultos</SelectItem>
            <SelectItem value="reported">Reportados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading && (
          <p className="rounded-xl border border-dashed border-border/60 bg-background p-6 text-center text-sm text-muted-foreground">
            Carregando posts...
          </p>
        )}
        {!isLoading && (data?.items ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-border/60 bg-background p-6 text-center text-sm text-muted-foreground">
            Nenhum post encontrado.
          </p>
        )}
        {(data?.items ?? []).map((p) => (
          <article
            key={p.id}
            className="rounded-xl border border-border/60 bg-background p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-foreground">{p.title}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      p.status === "published"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : p.status === "hidden"
                          ? "bg-neutral-500/15 text-neutral-600 dark:text-neutral-400"
                          : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.body}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{p.author?.full_name ?? p.author?.email ?? "Autor desconhecido"}</span>
                  <span>·</span>
                  <span>{new Date(p.created_at).toLocaleString("pt-BR")}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {p.likes_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {p.comments_count}
                  </span>
                  <span>· {p.topic}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {p.status !== "published" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moderate.mutate({ id: p.id, action: "publish" })}
                    title="Publicar"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </Button>
                )}
                {p.status !== "hidden" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moderate.mutate({ id: p.id, action: "hide" })}
                    title="Ocultar"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Remover este post permanentemente?"))
                      moderate.mutate({ id: p.id, action: "delete" });
                  }}
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
