import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Mail, Phone, Star, ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  getProfessionalBySlug,
  submitProfessionalReview,
  requestProfessionalContact,
} from "@/modules/marketplace/api.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/profissional/$slug")({
  loader: async ({ params }) => {
    const pro = await getProfessionalBySlug({ data: { slug: params.slug } });
    if (!pro) throw notFound();
    return { pro };
  },
  head: ({ loaderData }) => {
    const pro = loaderData?.pro;
    if (!pro) {
      return { meta: [{ title: "Profissional · Meu Mundo Azul" }] };
    }
    const title = `${pro.full_name} · Meu Mundo Azul`;
    const description =
      pro.bio?.slice(0, 155) ??
      `${pro.full_name} atende no ${[pro.city, pro.state].filter(Boolean).join(", ") || "Brasil"}. Perfil verificado no Meu Mundo Azul.`;
    const meta: Array<{ name?: string; property?: string; content: string; title?: string }> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ];
    if (pro.photo_url) {
      meta.push({ property: "og:image", content: pro.photo_url });
      meta.push({ name: "twitter:image", content: pro.photo_url });
    }
    return { meta };
  },
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl p-10 text-center text-sm text-muted-foreground">
      Não foi possível carregar este perfil. {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl p-10 text-center">
      <h1 className="text-xl font-semibold">Perfil não encontrado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Este profissional pode ter deixado o marketplace ou o endereço mudou.
      </p>
      <Button asChild className="mt-4" variant="outline">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  ),
  component: ProfessionalPublicPage,
});

function ProfessionalPublicPage() {
  const { pro } = Route.useLoaderData();
  const auth = useAuth();
  const qc = useQueryClient();

  const submitReview = useServerFn(submitProfessionalReview);
  const requestContact = useServerFn(requestProfessionalContact);

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  const reviewMut = useMutation({
    mutationFn: () =>
      submitReview({
        data: { professional_user_id: pro.user_id, rating, comment: comment || null },
      }),
    onSuccess: () => {
      toast.success("Avaliação enviada");
      setComment("");
      qc.invalidateQueries({ queryKey: ["public-professional", pro.slug] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const contactMut = useMutation({
    mutationFn: () =>
      requestContact({
        data: { professional_user_id: pro.user_id, message: contactMsg },
      }),
    onSuccess: () => {
      toast.success("Solicitação enviada");
      setContactMsg("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const councilLabel =
    [pro.council_type, pro.council_number, pro.council_state].filter(Boolean).join(" ") || null;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Meu Mundo Azul
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/marketplace">
              <ArrowLeft className="mr-1 h-3 w-3" /> Ver todos
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <section className="flex flex-col gap-6 rounded-3xl border bg-card p-6 sm:flex-row">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {pro.photo_url ? (
              <img
                src={pro.photo_url}
                alt={pro.full_name}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <Sparkles className="h-8 w-8" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{pro.full_name}</h1>
              <Badge variant="default" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> Verificado
              </Badge>
              {pro.plan !== "free" && <Badge variant="secondary">Destaque</Badge>}
            </div>
            {councilLabel && (
              <p className="text-sm text-muted-foreground">{councilLabel}</p>
            )}
            <div className="flex flex-wrap gap-1 pt-1">
              {(pro.specialties ?? []).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
              {(pro.city || pro.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[pro.city, pro.state].filter(Boolean).join(", ")}
                </span>
              )}
              {pro.modality && <span>{pro.modality}</span>}
              {pro.price_range && <span>{pro.price_range}</span>}
              {pro.reviews_count > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {Number(pro.average_rating).toFixed(1)} · {pro.reviews_count}
                </span>
              )}
            </div>
          </div>
        </section>

        {pro.bio && (
          <section className="rounded-3xl border bg-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sobre
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{pro.bio}</p>
          </section>
        )}

        <section className="grid gap-4 rounded-3xl border bg-card p-6 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Contato
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              {pro.contact_email && (
                <a
                  href={`mailto:${pro.contact_email}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <Mail className="h-4 w-4" /> {pro.contact_email}
                </a>
              )}
              {pro.contact_phone && (
                <a
                  href={`tel:${pro.contact_phone}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <Phone className="h-4 w-4" /> {pro.contact_phone}
                </a>
              )}
              {!pro.contact_email && !pro.contact_phone && (
                <p className="text-muted-foreground">
                  Envie uma solicitação pelo formulário ao lado.
                </p>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Solicitar contato
            </h2>
            {auth.user ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  rows={4}
                  placeholder="Conte brevemente sobre sua família"
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (contactMsg.trim().length < 5) {
                      toast.error("Escreva uma mensagem");
                      return;
                    }
                    contactMut.mutate();
                  }}
                  disabled={contactMut.isPending}
                >
                  Enviar solicitação
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>Entre na plataforma para enviar uma solicitação de contato.</p>
                <Button asChild size="sm">
                  <Link to="/auth">Entrar</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Avaliações ({pro.reviews_count})
          </h2>

          {auth.user && auth.user.id !== pro.user_id && (
            <div className="mt-4 space-y-2 rounded-2xl border border-dashed p-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} estrelas`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                rows={3}
                placeholder="Compartilhe sua experiência (opcional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button size="sm" onClick={() => reviewMut.mutate()} disabled={reviewMut.isPending}>
                Publicar avaliação
              </Button>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {pro.reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda sem avaliações.</p>
            ) : (
              pro.reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border p-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
