import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, MessageCircle, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  addComment,
  createCommunityPost,
  deleteCommunityPost,
  listCommunityPosts,
  listComments,
  toggleLike,
} from "@/modules/community/api.functions";

export const Route = createFileRoute("/app/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade · Meu Mundo Azul" },
      {
        name: "description",
        content:
          "Feed colaborativo entre famílias que vivenciam o neurodesenvolvimento. Compartilhe experiências, dicas e apoio.",
      },
      { property: "og:title", content: "Comunidade · Meu Mundo Azul" },
      {
        property: "og:description",
        content: "Feed colaborativo entre famílias que vivenciam o neurodesenvolvimento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityPage,
});

const TOPICS = ["geral", "rotina", "escola", "terapia", "familia", "conquistas"];

function CommunityPage() {
  const qc = useQueryClient();
  const list = useServerFn(listCommunityPosts);
  const create = useServerFn(createCommunityPost);
  const remove = useServerFn(deleteCommunityPost);
  const like = useServerFn(toggleLike);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["community", "posts"],
    queryFn: () => list(),
  });

  const createMut = useMutation({
    mutationFn: (data: { title: string; body: string; topic: string }) =>
      create({ data }),
    onSuccess: () => {
      toast.success("Publicação criada!");
      qc.invalidateQueries({ queryKey: ["community", "posts"] });
    },
    onError: () => toast.error("Não foi possível publicar."),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community", "posts"] }),
  });

  const likeMut = useMutation({
    mutationFn: (v: { post_id: string; liked: boolean }) => like({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community", "posts"] }),
  });

  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("geral");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Comunidade</h1>
          <p className="text-sm text-muted-foreground">
            Trocas reais entre famílias e cuidadores. Seja gentil, respeitoso e nunca compartilhe dados pessoais das crianças.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-border/60 bg-background p-4 space-y-3">
        <h2 className="text-sm font-semibold">Compartilhar algo com a comunidade</h2>
        <Input
          placeholder="Título da publicação"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
        />
        <Textarea
          placeholder="Conte sua experiência, faça uma pergunta, compartilhe uma dica…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={4000}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Tópico:</span>
          {TOPICS.map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => setTopic(tp)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                topic === tp
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {tp}
            </button>
          ))}
          <Button
            size="sm"
            className="ml-auto"
            disabled={createMut.isPending || title.length < 3 || body.length < 10}
            onClick={() => {
              createMut.mutate(
                { title, body, topic },
                {
                  onSuccess: () => {
                    setTitle("");
                    setBody("");
                    setTopic("geral");
                  },
                },
              );
            }}
          >
            Publicar
          </Button>
        </div>
      </section>

      {isLoading && (
        <p className="text-center text-sm text-muted-foreground">Carregando…</p>
      )}

      <section className="space-y-3">
        {posts?.map((p) => (
          <article
            key={p.id}
            className="rounded-2xl border border-border/60 bg-background p-4"
          >
            <header className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {p.author?.full_name ?? "Membro"}
                  </span>
                  <Badge variant="outline" className="capitalize">{p.topic}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(p.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              {p.is_mine && (
                <button
                  onClick={() => removeMut.mutate(p.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Apagar publicação"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </header>
            <h3 className="mt-2 text-base font-semibold text-foreground">{p.title}</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{p.body}</p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <button
                onClick={() => likeMut.mutate({ post_id: p.id, liked: p.liked_by_me })}
                className={`flex items-center gap-1.5 ${
                  p.liked_by_me ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                }`}
              >
                <Heart className={`h-4 w-4 ${p.liked_by_me ? "fill-current" : ""}`} />
                <span>{p.likes_count}</span>
              </button>
              <button
                onClick={() => setOpenPostId(openPostId === p.id ? null : p.id)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{p.comments_count}</span>
              </button>
            </div>

            {openPostId === p.id && <Comments postId={p.id} />}
          </article>
        ))}
        {!isLoading && (!posts || posts.length === 0) && (
          <p className="text-center text-sm text-muted-foreground">
            Ainda não há publicações. Seja o primeiro a compartilhar.
          </p>
        )}
      </section>
    </div>
  );
}

function Comments({ postId }: { postId: string }) {
  const qc = useQueryClient();
  const fetchComments = useServerFn(listComments);
  const addC = useServerFn(addComment);
  const { data: comments } = useQuery({
    queryKey: ["community", "comments", postId],
    queryFn: () => fetchComments({ data: { post_id: postId } }),
  });
  const [text, setText] = useState("");

  const addMut = useMutation({
    mutationFn: (body: string) => addC({ data: { post_id: postId, body } }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["community", "comments", postId] });
      qc.invalidateQueries({ queryKey: ["community", "posts"] });
    },
  });

  return (
    <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
      {comments?.map((c) => (
        <div key={c.id} className="rounded-lg bg-muted/40 p-2 text-sm">
          <p className="text-xs font-semibold">{c.author?.full_name ?? "Membro"}</p>
          <p className="text-muted-foreground">{c.body}</p>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          placeholder="Escreva um comentário…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
        />
        <Button
          size="sm"
          disabled={addMut.isPending || text.trim().length === 0}
          onClick={() => addMut.mutate(text.trim())}
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}
