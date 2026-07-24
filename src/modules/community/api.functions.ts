import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCommunityPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: posts, error } = await supabase
      .from("community_posts")
      .select("id, title, body, topic, status, likes_count, comments_count, author_id, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const authorIds = Array.from(new Set((posts ?? []).map((p) => p.author_id)));
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", authorIds.length ? authorIds : ["00000000-0000-0000-0000-000000000000"]);
    const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

    const postIds = (posts ?? []).map((p) => p.id);
    const { data: myLikes } = await supabase
      .from("community_likes")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds.length ? postIds : ["00000000-0000-0000-0000-000000000000"]);
    const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));

    return (posts ?? []).map((p) => ({
      ...p,
      author: authorMap.get(p.author_id) ?? null,
      liked_by_me: likedSet.has(p.id),
      is_mine: p.author_id === userId,
    }));
  });

export const createCommunityPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        title: z.string().min(3).max(140),
        body: z.string().min(10).max(4000),
        topic: z.string().min(1).max(40).default("geral"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({ ...data, author_id: userId })
      .select()
      .single();
    if (error) throw error;
    return post;
  });

export const deleteCommunityPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("community_posts")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ post_id: z.string().uuid(), liked: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.liked) {
      await supabase.from("community_likes").delete().eq("post_id", data.post_id).eq("user_id", userId);
    } else {
      await supabase.from("community_likes").insert({ post_id: data.post_id, user_id: userId });
    }
    return { ok: true };
  });

export const listComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ post_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: comments, error } = await supabase
      .from("community_comments")
      .select("id, body, author_id, created_at")
      .eq("post_id", data.post_id)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const ids = Array.from(new Set((comments ?? []).map((c) => c.author_id)));
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

    return (comments ?? []).map((c) => ({
      ...c,
      author: authorMap.get(c.author_id) ?? null,
    }));
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ post_id: z.string().uuid(), body: z.string().min(1).max(1000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("community_comments")
      .insert({ post_id: data.post_id, body: data.body, author_id: userId });
    if (error) throw error;
    return { ok: true };
  });
