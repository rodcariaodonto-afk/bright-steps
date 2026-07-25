import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Star, BookOpen, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveChild } from "@/hooks/use-active-child";
import { useTranslatedContent } from "@/hooks/use-translated-content";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StoryPlayer } from "@/modules/stories/runtime/story-player";
import { STORY_ENGINES } from "@/modules/stories/story-registry";
import type { StoryRow, StoryType } from "@/modules/stories/types";

export const Route = createFileRoute("/kid/historias")({
  component: KidStories,
});

function KidStories() {
  const { activeChild } = useActiveChild();
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<StoryRow | null>(null);
  const [filter, setFilter] = useState<StoryType | "all">("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("content_stories")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      setStories((data ?? []) as StoryRow[]);
      setLoading(false);
    })();
  }, []);

  if (!activeChild) {
    return (
      <div className="p-6 text-center text-[#0b2740]/70">
        Escolha uma criança no painel principal para ler histórias.
      </div>
    );
  }

  if (playing) {
    return <StoryPlayer childId={activeChild.id} story={playing} onExit={() => setPlaying(null)} />;
  }

  const shown = stories.filter((s) => filter === "all" || s.story_type === filter);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
          <BookOpen className="h-8 w-8 text-[#0b6cff]" />
        </div>
        <h1 className="text-2xl font-black text-[#0b2740]">Histórias</h1>
        <p className="text-sm text-[#0b2740]/70">Leia, escolha caminhos e ganhe estrelas!</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>Todas</FilterChip>
        {Object.values(STORY_ENGINES).map((e) => (
          <FilterChip key={e.code} active={filter === e.code} onClick={() => setFilter(e.code)}>
            {e.label}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#0b2740]/60" /></div>
      ) : shown.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#0b2740]/70">
          Nenhuma história por aqui ainda.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => (
            <Card key={s.id} className="overflow-hidden border-white/60 bg-white/90 p-0 shadow-md">
              {s.cover_url ? (
                <img src={s.cover_url} alt={s.title} className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-[#7fd0ff] to-[#0b6cff] text-5xl">
                  📖
                </div>
              )}
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#0b6cff]">
                  {s.story_type === "branching" && <Sparkles className="h-3 w-3" />}
                  {STORY_ENGINES[s.story_type]?.label ?? s.story_type}
                </div>
                <h3 className="font-bold text-[#0b2740]">{s.title}</h3>
                {s.summary && <p className="text-xs text-[#0b2740]/70 line-clamp-2">{s.summary}</p>}
                <div className="flex items-center justify-between pt-2">
                  <span className="flex items-center gap-1 text-xs font-bold text-yellow-700">
                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-600" />
                    +{s.stars_reward ?? 3}
                  </span>
                  <Button size="sm" onClick={() => setPlaying(s)}>Ler</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-3 py-1 text-xs font-bold transition " +
        (active ? "bg-[#0b6cff] text-white shadow" : "bg-white/80 text-[#0b2740] hover:bg-white")
      }
    >
      {children}
    </button>
  );
}
