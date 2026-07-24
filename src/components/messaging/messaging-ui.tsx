import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import {
  listMessages,
  listMyConversations,
  markConversationRead,
  sendMessage,
} from "@/modules/messaging/api.functions";

type Conversation = Awaited<ReturnType<typeof listMyConversations>>[number];

export function MessagingUI({ variant = "family" }: { variant?: "family" | "pro" }) {
  const { session } = useSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();
  const listConvs = useServerFn(listMyConversations);
  const listMsgs = useServerFn(listMessages);
  const send = useServerFn(sendMessage);
  const markRead = useServerFn(markConversationRead);

  const { data: conversations = [] } = useQuery({
    queryKey: ["messaging", "conversations"],
    queryFn: () => listConvs(),
    refetchInterval: 20000,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    if (!activeId && conversations.length > 0) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  const active = conversations.find((c) => c.id === activeId);

  const { data: messages = [] } = useQuery({
    queryKey: ["messaging", "messages", activeId],
    queryFn: () => (activeId ? listMsgs({ data: { conversation_id: activeId } }) : Promise.resolve([])),
    enabled: !!activeId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`msgs:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["messaging", "messages", activeId] });
          qc.invalidateQueries({ queryKey: ["messaging", "conversations"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, qc]);

  // Mark as read on open
  useEffect(() => {
    if (activeId) {
      markRead({ data: { conversation_id: activeId } }).then(() =>
        qc.invalidateQueries({ queryKey: ["messaging", "conversations"] }),
      );
    }
  }, [activeId, markRead, qc]);

  const sendMut = useMutation({
    mutationFn: (body: string) =>
      send({ data: { conversation_id: activeId as string, body } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messaging", "messages", activeId] });
      qc.invalidateQueries({ queryKey: ["messaging", "conversations"] });
    },
  });

  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="grid h-[calc(100dvh-12rem)] grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
      <aside className="overflow-y-auto rounded-2xl border bg-card">
        <div className="border-b p-3 text-sm font-medium">Conversas</div>
        {conversations.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {variant === "family"
              ? "Nenhuma conversa. Acesse o Marketplace e contate um profissional."
              : "Nenhuma conversa ainda."}
          </p>
        ) : (
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 border-b px-3 py-2.5 text-left text-sm hover:bg-muted/50",
                    c.id === activeId && "bg-muted",
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {c.other?.full_name ?? c.other?.email ?? "Participante"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(c.last_message_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  {c.unread > 0 && <Badge>{c.unread}</Badge>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="flex flex-col overflow-hidden rounded-2xl border bg-card">
        {active ? (
          <>
            <header className="border-b p-3">
              <div className="font-medium">
                {active.other?.full_name ?? active.other?.email ?? "Participante"}
              </div>
              <div className="text-xs text-muted-foreground">
                {active.my_role === "family" ? "Profissional" : "Família"}
              </div>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => {
                const mine = m.sender_id === userId;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                        mine ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <div className={cn("mt-1 text-[10px] opacity-70")}>
                        {new Date(m.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <form
              className="flex gap-2 border-t p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                sendMut.mutate(text.trim());
                setText("");
              }}
            >
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva uma mensagem"
              />
              <Button type="submit" size="icon" disabled={sendMut.isPending || !text.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Selecione uma conversa
          </div>
        )}
      </section>
    </div>
  );
}

export type { Conversation };
