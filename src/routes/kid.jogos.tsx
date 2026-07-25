import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveChild } from "@/hooks/use-active-child";
import { GamePlayer } from "@/modules/games/runtime/game-player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    return () => {
      cancelled = true;
    };
  }, []);

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
      <div>
        <h1 className="text-2xl font-black text-[#0b2740]">Jogos</h1>
        <p className="text-sm text-[#0b2740]/70">Escolha um jogo para começar.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#0b2740]/60" /></div>
      ) : games.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum jogo disponível ainda. Volte em breve!
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <Card key={g.id} className="overflow-hidden border-white/60 bg-white/80 p-0 shadow-md">
              {g.cover_url ? (
                <img src={g.cover_url} alt={g.title} className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-[#7fd0ff] to-[#0b6cff] text-5xl">🎮</div>
              )}
              <div className="space-y-2 p-4">
                <h3 className="font-bold text-[#0b2740]">{g.title}</h3>
                {g.description && <p className="text-xs text-[#0b2740]/70 line-clamp-2">{g.description}</p>}
                <div className="flex items-center justify-between pt-2">
                  <span className="flex items-center gap-1 text-xs font-bold text-yellow-700">
                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-600" />
                    até {g.stars_reward ?? 5}
                  </span>
                  <Button size="sm" onClick={() => setPlaying(g)}>Jogar</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
