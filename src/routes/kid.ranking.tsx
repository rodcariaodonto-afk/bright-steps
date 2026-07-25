import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Star, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/kid/ranking")({
  component: KidRankingPage,
});

interface Row {
  display_name: string;
  stars: number;
  lifetime_stars: number;
  rank: number;
}

function KidRankingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("top_kids_leaderboard", { limit_n: 20 });
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild size="sm" variant="ghost" className="text-[#0b2740]">
          <Link to="/kid/jogos"><ArrowLeft className="mr-1 h-4 w-4" />Voltar</Link>
        </Button>
      </div>
      <div className="text-center">
        <div className="mx-auto mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-300 shadow-lg">
          <Trophy className="h-9 w-9 text-yellow-800" />
        </div>
        <h1 className="text-2xl font-black text-[#0b2740]">Ranking dos jogadores</h1>
        <p className="text-sm text-[#0b2740]/70">As crianças que mais colecionaram estrelas!</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#0b2740]/60" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#0b2740]/70">
          Ainda não há jogadores no ranking. Seja o primeiro!
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const podium = r.rank <= 3;
            const medal = r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `${r.rank}º`;
            return (
              <Card
                key={r.rank}
                className={
                  "flex items-center gap-3 p-3 " +
                  (podium ? "border-yellow-300 bg-gradient-to-r from-yellow-50 to-white shadow-lg" : "bg-white/80")
                }
              >
                <div className="w-10 text-center text-2xl font-black">{medal}</div>
                <div className="flex-1 truncate font-bold text-[#0b2740]">{r.display_name}</div>
                <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-black text-yellow-900">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-700" />
                  {r.lifetime_stars}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
