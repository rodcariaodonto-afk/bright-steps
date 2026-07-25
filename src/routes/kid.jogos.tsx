import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Star, Sparkles, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveChild } from "@/hooks/use-active-child";
import { GamePlayer } from "@/modules/games/runtime/game-player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { recommendGames } from "@/modules/games/recommend.functions";
import { useTranslatedContent } from "@/hooks/use-translated-content";

export const Route = createFileRoute("/kid/jogos")({
  component: KidGamesPage,
});

interface GameRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  engine_code: string | null;
  config: unknown;
  stars_reward: number | null;
  age_min: number | null;
  age_max: number | null;
  accessibility: any;
}

function KidGamesPage() {
  const { activeChild } = useActiveChild();
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<GameRow | null>(null);
  const [recs, setRecs] = useState<{ id: string; slug: string; title: string; reason: string }[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const recommendFn = useServerFn(recommendGames);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: engines } = await supabase.from("game_engines").select("code").eq("active", true);
      const activeCodes = (engines ?? []).map((e) => e.code);
      const { data } = await supabase
        .from("content_games")
        .select("id,slug,title,description,cover_url,engine_code,config,stars_reward,age_min,age_max,accessibility")
        .eq("published", true)
        .in("engine_code", activeCodes.length ? activeCodes : ["__none__"]);
      if (!cancelled) {
        setGames((data ?? []) as GameRow[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeChild?.id) return;
    setRecLoading(true);
    recommendFn({ data: { childId: activeChild.id } })
      .then((r) => setRecs(r.recommendations ?? []))
      .catch(() => setRecs([]))
      .finally(() => setRecLoading(false));
  }, [activeChild?.id, recommendFn]);

  if (!activeChild) {
    return (
      <div className="p-6 text-center text-[#0b2740]/70">
        Escolha uma criança no painel principal para jogar.
      </div>
    );
  }

  if (playing) {
    return <GamePlayer childId={activeChild.id} game={playing as any} onExit={() => setPlaying(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0b2740]">Jogos</h1>
          <p className="text-sm text-[#0b2740]/70">Escolha um jogo para começar.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link to="/kid/ranking"><Trophy className="mr-1 h-4 w-4" />Ranking</Link>
        </Button>
      </div>

      {/* Sugestões da Azul */}
      {(recLoading || recs.length > 0) && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            <h2 className="font-bold text-[#0b2740]">Azul recomenda para você</h2>
          </div>
          {recLoading ? (
            <div className="flex items-center gap-2 text-sm text-[#0b2740]/60">
              <Loader2 className="h-4 w-4 animate-spin" /> Pensando...
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              {recs.map((r) => {
                const g = games.find((gg) => gg.id === r.id);
                if (!g) return null;
                return <RecCard key={r.id} game={g} reason={r.reason} onOpen={() => setPlaying(g)} />;
              })}
            </div>
          )}
        </Card>
      )}


      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#0b2740]/60" /></div>
      ) : games.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum jogo disponível ainda. Volte em breve!
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <GameCard key={g.id} game={g} onOpen={() => setPlaying(g)} />
          ))}
        </div>
      )}
    </div>
  );
}
