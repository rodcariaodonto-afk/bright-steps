import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useActiveChild } from "@/hooks/use-active-child";
import { useKidRewards } from "@/hooks/use-kid-rewards";
import { useCreateMood } from "@/hooks/use-care";

export const Route = createFileRoute("/kid/humor")({
  component: KidMood,
});

const OPTIONS = [
  { score: 1, emoji: "😢" },
  { score: 2, emoji: "😕" },
  { score: 3, emoji: "😐" },
  { score: 4, emoji: "🙂" },
  { score: 5, emoji: "😄" },
] as const;

function KidMood() {
  const { t } = useTranslation("kid");
  const { activeChild } = useActiveChild();
  const { addStars } = useKidRewards(activeChild?.id);
  const createMood = useCreateMood(activeChild?.id);
  const navigate = useNavigate();
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  async function pick(score: 1 | 2 | 3 | 4 | 5) {
    if (!activeChild || saving) return;
    setSaving(score);
    try {
      await createMood.mutateAsync({
        child_id: activeChild.id,
        level: score,
        emoji: OPTIONS.find((o) => o.score === score)?.emoji ?? null,
        note: null,
        logged_at: new Date().toISOString(),
      });
      addStars(1);
      setSaved(true);
      setTimeout(() => navigate({ to: "/kid" }), 1400);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6 text-center">
      <div>
        <h1 className="text-2xl font-black">{t("mood.title")}</h1>
        <p className="mt-1 text-sm font-semibold text-[#0b2740]/70">
          {t("mood.subtitle")}
        </p>
      </div>

      {!activeChild ? (
        <div className="rounded-3xl bg-white/80 p-6 text-sm font-semibold">
          {t("mood.signIn")}
        </div>
      ) : saved ? (
        <div className="rounded-3xl bg-yellow-200 p-8 text-lg font-black text-yellow-900 shadow-lg">
          ⭐ {t("mood.saved")}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.score}
              type="button"
              onClick={() => pick(o.score as 1 | 2 | 3 | 4 | 5)}
              disabled={saving !== null}
              className="flex flex-col items-center gap-1 rounded-3xl bg-white/90 p-3 shadow-md transition hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <span className="text-4xl">{o.emoji}</span>
              <span className="text-[10px] font-bold text-[#0b2740]/70">
                {t(`mood.options.${o.score}`)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
