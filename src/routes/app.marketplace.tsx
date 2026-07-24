import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Star, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  listMarketplaceProfessionals,
  listMyContactRequests,
} from "@/modules/marketplace/api.functions";

export const Route = createFileRoute("/app/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace de Profissionais · Meu Mundo Azul" },
      {
        name: "description",
        content:
          "Encontre terapeutas, psicólogos e especialistas em neurodesenvolvimento verificados na plataforma.",
      },
      { property: "og:title", content: "Marketplace · Meu Mundo Azul" },
      {
        property: "og:description",
        content: "Profissionais verificados para apoiar sua família.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const list = useServerFn(listMarketplaceProfessionals);
  const mine = useServerFn(listMyContactRequests);

  const { data: pros = [], isLoading } = useQuery({
    queryKey: ["marketplace", "pros"],
    queryFn: () => list(),
  });
  const { data: myReqs = [] } = useQuery({
    queryKey: ["marketplace", "my-requests"],
    queryFn: () => mine(),
  });

  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<string>("");

  const specialties = Array.from(
    new Set(pros.flatMap((p) => p.specialties ?? [])),
  ).sort();

  const filtered = pros.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      p.full_name.toLowerCase().includes(q) ||
      (p.city ?? "").toLowerCase().includes(q) ||
      (p.bio ?? "").toLowerCase().includes(q);
    const matchS = !specialty || (p.specialties ?? []).includes(specialty);
    return matchQ && matchS;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Marketplace de Profissionais
        </h1>
        <p className="text-sm text-muted-foreground">
          Todos os perfis passam por verificação de conselho antes de aparecerem aqui.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row">
        <Input
          placeholder="Buscar por nome, cidade ou bio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        >
          <option value="">Todas especialidades</option>
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando profissionais...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nenhum profissional encontrado. Novos perfis passam por moderação antes de aparecerem.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProCard key={p.id} pro={p} />
          ))}
        </div>
      )}

      {myReqs.length > 0 && (
        <section className="space-y-2 pt-6">
          <h2 className="text-lg font-semibold">Minhas solicitações</h2>
          <div className="space-y-2">
            {myReqs.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm"
              >
                <span className="line-clamp-1 text-muted-foreground">{r.message}</span>
                <Badge variant={r.status === "accepted" ? "default" : "secondary"}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

type Pro = Awaited<ReturnType<typeof listMarketplaceProfessionals>>[number];

function ProCard({ pro }: { pro: Pro }) {
  const councilLabel =
    [pro.council_type, pro.council_number, pro.council_state].filter(Boolean).join(" ") || null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {pro.photo_url ? (
            <img
              src={pro.photo_url}
              alt={pro.full_name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold leading-tight">{pro.full_name}</h3>
            {pro.plan !== "free" && (
              <Badge variant="default" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> Destaque
              </Badge>
            )}
          </div>
          {councilLabel && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" /> {councilLabel}
            </p>
          )}
        </div>
      </div>

      {pro.reviews_count > 0 && (
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-medium">{Number(pro.average_rating).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">
            ({pro.reviews_count} avaliaç{pro.reviews_count === 1 ? "ão" : "ões"})
          </span>
        </div>
      )}

      {pro.bio && <p className="line-clamp-3 text-sm text-muted-foreground">{pro.bio}</p>}

      <div className="flex flex-wrap gap-1">
        {(pro.specialties ?? []).slice(0, 4).map((s) => (
          <Badge key={s} variant="secondary" className="text-xs">
            {s}
          </Badge>
        ))}
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {(pro.city || pro.state) && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {[pro.city, pro.state].filter(Boolean).join(", ")}
            {pro.modality && ` · ${pro.modality}`}
          </div>
        )}
        {pro.price_range && <div>Faixa: {pro.price_range}</div>}
        {pro.accepting_patients && (
          <div className="text-emerald-600">Aceitando novos pacientes</div>
        )}
      </div>

      {pro.slug && (
        <Button asChild size="sm" className="mt-auto">
          <Link to="/profissional/$slug" params={{ slug: pro.slug }}>
            Ver perfil e avaliações <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      )}
    </div>
  );
}
