import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("conversations")
      .select("id, family_user_id, professional_user_id, child_id, last_message_at, created_at")
      .or(`family_user_id.eq.${userId},professional_user_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });
    if (error) throw error;

    const otherIds = Array.from(
      new Set((data ?? []).map((c) => (c.family_user_id === userId ? c.professional_user_id : c.family_user_id))),
    );
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", otherIds.length ? otherIds : ["00000000-0000-0000-0000-000000000000"]);
    const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const convIds = (data ?? []).map((c) => c.id);
    const { data: unreadRows } = await supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", convIds.length ? convIds : ["00000000-0000-0000-0000-000000000000"])
      .neq("sender_id", userId)
      .is("read_at", null);
    const unreadMap = new Map<string, number>();
    for (const r of unreadRows ?? []) {
      unreadMap.set(r.conversation_id, (unreadMap.get(r.conversation_id) ?? 0) + 1);
    }

    return (data ?? []).map((c) => {
      const otherId = c.family_user_id === userId ? c.professional_user_id : c.family_user_id;
      return {
        ...c,
        other: pmap.get(otherId) ?? null,
        my_role: c.family_user_id === userId ? ("family" as const) : ("professional" as const),
        unread: unreadMap.get(c.id) ?? 0,
      };
    });
  });

export const openConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        professional_user_id: z.string().uuid().optional(),
        family_user_id: z.string().uuid().optional(),
        child_id: z.string().uuid().optional().nullable(),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const family_user_id = data.family_user_id ?? userId;
    const professional_user_id = data.professional_user_id ?? userId;
    if (family_user_id === professional_user_id) {
      throw new Error("Informe o outro participante");
    }
    if (family_user_id !== userId && professional_user_id !== userId) {
      throw new Error("Você não faz parte desta conversa");
    }

    const child_id = data.child_id ?? null;
    let query = supabase
      .from("conversations")
      .select("id")
      .eq("family_user_id", family_user_id)
      .eq("professional_user_id", professional_user_id);
    query = child_id ? query.eq("child_id", child_id) : query.is("child_id", null);
    const { data: existing } = await query.maybeSingle();
    if (existing) return { id: existing.id };

    const { data: inserted, error } = await supabase
      .from("conversations")
      .insert({ family_user_id, professional_user_id, child_id })
      .select("id")
      .single();
    if (error) throw error;
    return { id: inserted.id };
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ conversation_id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: msgs, error } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, read_at, created_at")
      .eq("conversation_id", data.conversation_id)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw error;
    return msgs ?? [];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ conversation_id: z.string().uuid(), body: z.string().min(1).max(4000) }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: data.conversation_id, sender_id: userId, body: data.body });
    if (error) throw error;
    return { ok: true };
  });

export const markConversationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ conversation_id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", data.conversation_id)
      .neq("sender_id", userId)
      .is("read_at", null);
    return { ok: true };
  });
