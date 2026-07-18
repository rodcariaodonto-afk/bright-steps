import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Send, Loader2, AlertTriangle, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pro/ia")({
  component: ProAiPage,
});

function ProAiPage() {
  const { t } = useTranslation("pro");
  const suggestions = t("ai.suggestions", { returnObjects: true }) as string[];

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { persona: "clinical" },
    }),
    onError: (err) => setError(err.message || "Erro ao conversar com o Atlas Clínico."),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setError(null);
    setInput("");
    await sendMessage({ text: trimmed });
  }

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col lg:h-[calc(100dvh-2.75rem)]">
      <div className="border-b border-border/60 bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">{t("ai.title")}</h1>
            <p className="text-[11px] text-muted-foreground">{t("ai.subtitle")}</p>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-[11px] text-destructive">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5" aria-hidden="true" />
          {t("ai.disclaimer")}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <p className="text-xs text-muted-foreground">
                Comece com uma das sugestões ou pergunte livremente. O Atlas Clínico usa
                dados dos seus pacientes autorizados. Nunca emite diagnóstico.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-foreground hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user";
            const text = message.parts
              .map((part) => (part.type === "text" ? part.text : ""))
              .join("");
            return (
              <div key={message.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                    isUser
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border/60 bg-card text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap">{text}</p>
                </div>
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-border/60 bg-card px-4 py-2.5 text-[13px] text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  Atlas Clínico está analisando…
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-foreground" role="alert">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/60 bg-background px-4 py-3 md:px-8">
        <form
          className="mx-auto flex max-w-3xl items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="Pergunte ao Atlas Clínico…"
            rows={1}
            className="min-h-[44px] resize-none rounded-xl text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-[44px] w-[44px] shrink-0 rounded-xl p-0"
            aria-label="Enviar"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
