import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Star } from "lucide-react";
import { useKidRewards } from "@/hooks/use-kid-rewards";
import { useTranslatedContent } from "@/hooks/use-translated-content";
import { getStoryEngine } from "../story-registry";
import type { StoryRow } from "../types";

interface Props {
  childId: string;
  story: StoryRow;
  onExit: () => void;
}

export function StoryPlayer({ childId, story, onExit }: Props) {
  const engine = getStoryEngine(story.story_type);
  const { addStars } = useKidRewards(childId);
  const { data: t, loading } = useTranslatedContent("story", story.id, {
    title: story.title,
    summary: story.summary,
    config: story.config as never,
  });

  if (!engine) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Tipo de história desconhecido: {story.story_type}</p>
        <Button className="mt-4" onClick={onExit}>Voltar</Button>
      </div>
    );
  }

  const Comp = engine.Component;

  const finish = () => {
    const stars = story.stars_reward ?? 3;
    addStars(stars, `História: ${t.title}`, `story:${story.id}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit} className="text-[#0b2740]">
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-900">
          <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-700" />
          +{story.stars_reward ?? 3}
        </div>
      </div>
      <h1 className="text-center text-xl font-black text-[#0b2740]">
        {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : t.title}
      </h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#0b2740]/50" />
        </div>
      ) : (
        <Comp
          config={t.config as never}
          onFinish={(res) => {
            if (res.completed) finish();
            onExit();
          }}
        />
      )}
    </div>
  );
}

