import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";

import { useActiveChild } from "@/hooks/use-active-child";
import { createAuthedChatTransport } from "@/lib/authed-chat-transport";

export const Route = createFileRoute("/kid/azul")({
  component: KidAzulChat,
});

function KidAzulChat() {
  const { t } = useTranslation("kid");
  const { activeChild } = useActiveChild();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: createAuthedChatTransport({
      api: "/api/chat",
      body: { persona: "child", childId: activeChild?.id },
    }),
  });
  const loading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function send() {
    const t2 = input.trim();
    if (!t2 || loading) return;
    sendMessage({ text: t2 });
    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh-16rem)] flex-col">
      <div className="mb-3 text-center">
        <h1 className="text-2xl font-black">{t("azul.title")} 💙</h1>
        <p className="text-xs font-semibold text-[#0b2740]/70">{t("azul.hint")}</p>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-3xl bg-white/70 p-4 shadow-inner"
      >
        {messages.length === 0 && (
          <div className="rounded-2xl bg-[#0b6cff] px-4 py-3 text-sm font-semibold text-white shadow">
            Oi! Sou o Azul. Me conta uma coisa legal do seu dia! 💙
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] rounded-2xl bg-yellow-300 px-4 py-2 text-sm font-semibold text-yellow-900 shadow"
                : "mr-auto max-w-[80%] rounded-2xl bg-[#0b6cff] px-4 py-3 text-sm font-semibold text-white shadow"
            }
          >
            {m.parts
              .filter((p) => p.type === "text")
              .map((p, i) => (
                <span key={i} className="whitespace-pre-wrap">
                  {(p as { text: string }).text}
                </span>
              ))}
          </div>
        ))}
        {loading && (
          <div className="mr-auto rounded-2xl bg-[#0b6cff]/80 px-4 py-2 text-sm font-semibold text-white shadow">
            ...
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder={t("azul.placeholder")}
          className="flex-1 rounded-full border-2 border-white bg-white px-4 py-3 text-base font-semibold text-[#0b2740] shadow-lg outline-none focus:border-[#0b6cff]"
        />
        <button
          type="button"
          onClick={send}
          disabled={loading || !input.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0b6cff] text-white shadow-lg hover:bg-[#0956d1] disabled:opacity-50"
          aria-label={t("azul.send")}
        >
          <Send className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
