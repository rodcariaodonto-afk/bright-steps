import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircleHeart, Smile, Wind, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/kid/")({
  component: KidHome,
});

const TILES = [
  { to: "/kid/azul", key: "azul", icon: MessageCircleHeart, bg: "from-sky-400 to-blue-600", emoji: "💙" },
  { to: "/kid/humor", key: "mood", icon: Smile, bg: "from-amber-300 to-orange-500", emoji: "😊" },
  { to: "/kid/respirar", key: "breathe", icon: Wind, bg: "from-emerald-300 to-teal-500", emoji: "🌬️" },
  { to: "/kid/historias", key: "stories", icon: BookOpen, bg: "from-fuchsia-400 to-purple-600", emoji: "📖" },
] as const;

function KidHome() {
  const { t } = useTranslation("kid");
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-black">{t("home.welcome")}</h1>
        <p className="mt-1 text-sm font-semibold text-[#0b2740]/70">
          {t("home.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.to}
              to={tile.to}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${tile.bg} p-5 text-white shadow-xl transition hover:scale-[1.02] active:scale-95`}
            >
              <div className="absolute -right-2 -top-2 text-6xl opacity-40 transition group-hover:opacity-60">
                {tile.emoji}
              </div>
              <Icon className="mb-3 h-8 w-8" aria-hidden />
              <div className="text-lg font-black">
                {t(`home.cards.${tile.key}.title`)}
              </div>
              <div className="mt-1 text-xs font-semibold opacity-90">
                {t(`home.cards.${tile.key}.desc`)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
