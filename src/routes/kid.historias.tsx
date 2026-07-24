import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { useActiveChild } from "@/hooks/use-active-child";
import { useKidRewards } from "@/hooks/use-kid-rewards";

export const Route = createFileRoute("/kid/historias")({
  component: KidStories,
});

const THEMES = [
  { id: "space", emoji: "🚀" },
  { id: "dinos", emoji: "🦖" },
  { id: "ocean", emoji: "🐙" },
  { id: "forest", emoji: "🌳" },
  { id: "cars", emoji: "🏎️" },
  { id: "animals", emoji: "🐶" },
] as const;

function KidStories() {
  const { t } = useTranslation("kid");
  const { activeChild } = useActiveChild();
  const { addStars } = useKidRewards(activeChild?.id);
  const [theme, setTheme] = useState<string | null>(null);
  const [rewarded, setRewarded] = useState(false);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { persona: "child", childId: activeChild?.id },
    }),
  });

  const loading = status === "submitted" || status === "streaming";
  const story = messages.filter((m) => m.role === "assistant").at(-1);

  function pick(id: string) {
    setTheme(id);
    setMessages([]);
    setRewarded(false);
    const name = activeChild?.nickname ?? activeChild?.full_name?.split(" ")[0] ?? "amiguinho";
    const themeLabel = t(`stories.themes.${id}`);
    sendMessage({
      text: `Invente uma história curta (4 a 6 parágrafos curtos), acolhedora e divertida, sobre "${themeLabel}", para ${name}. Use frases simples, sem violência, com um final feliz. Comece direto pela história, sem introdução.`,
    });
  }

  function finish() {
    if (rewarded) return;
    addStars(1);
    setRewarded(true);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-black">{t("stories.title")}</h1>
        <p className="mt-1 text-sm font-semibold text-[#0b2740]/70">
          {t("stories.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((tt) => (
          <button
            key={tt.id}
            type="button"
            onClick={() => pick(tt.id)}
            disabled={loading}
            className={`flex flex-col items-center gap-1 rounded-2xl p-3 shadow-md transition active:scale-95 disabled:opacity-50 ${
              theme === tt.id ? "bg-[#0b6cff] text-white" : "bg-white/90 text-[#0b2740]"
            }`}
          >
            <span className="text-3xl">{tt.emoji}</span>
            <span className="text-[11px] font-bold">
              {t(`stories.themes.${tt.id}`)}
            </span>
          </button>
        ))}
      </div>

      {theme && (
        <div className="rounded-3xl bg-white/95 p-5 shadow-xl">
          {loading && !story ? (
            <div className="text-center text-sm font-semibold text-[#0b2740]/70">
              {t("stories.loading")}
            </div>
          ) : story ? (
            <>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-[#0b2740]">
                {story.parts
                  .filter((p) => p.type === "text")
                  .map((p, i) => (
                    <p key={i}>{(p as { text: string }).text}</p>
                  ))}
              </div>
              {!loading && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={finish}
                    disabled={rewarded}
                    className="rounded-full bg-yellow-300 px-4 py-2 text-sm font-black text-yellow-900 shadow-md disabled:opacity-60"
                  >
                    ⭐ {t("stories.reward")}
                  </button>
                  <button
                    type="button"
                    onClick={() => pick(theme)}
                    className="rounded-full bg-[#0b6cff] px-4 py-2 text-sm font-black text-white shadow-md"
                  >
                    {t("stories.another")}
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
