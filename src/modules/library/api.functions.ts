import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listLibraryCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("library_categories")
    .select("id, slug, name, description, icon, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

export const listLibraryArticles = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({ categorySlug: z.string().optional(), q: z.string().optional() })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let query = supabase
      .from("library_articles")
      .select(
        "id, slug, title, summary, cover_url, reading_minutes, author_name, tags, audience, published_at, category_id, library_categories(slug, name)",
      )
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(200);
    if (data.q) query = query.ilike("title", `%${data.q}%`);
    const { data: rows, error } = await query;
    if (error) throw error;
    const filtered = data.categorySlug
      ? (rows ?? []).filter((r) => r.library_categories?.slug === data.categorySlug)
      : (rows ?? []);
    return filtered;
  });

export const getLibraryArticle = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: article, error } = await supabase
      .from("library_articles")
      .select(
        "id, slug, title, summary, body, cover_url, reading_minutes, author_name, tags, audience, published_at, library_categories(slug, name)",
      )
      .eq("slug", data.slug)
      .not("published_at", "is", null)
      .maybeSingle();
    if (error) throw error;
    return article;
  });

export const toggleArticleSaved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ articleId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("library_article_reads")
      .select("id, saved")
      .eq("user_id", userId)
      .eq("article_id", data.articleId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("library_article_reads")
        .update({ saved: !existing.saved })
        .eq("id", existing.id);
      if (error) throw error;
      return { saved: !existing.saved };
    }
    const { error } = await supabase
      .from("library_article_reads")
      .insert({ user_id: userId, article_id: data.articleId, saved: true, read_at: new Date().toISOString() });
    if (error) throw error;
    return { saved: true };
  });

export const listSavedArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("library_article_reads")
      .select("article_id, saved, library_articles(id, slug, title, summary, reading_minutes)")
      .eq("user_id", userId)
      .eq("saved", true);
    if (error) throw error;
    return data ?? [];
  });

// Admin
export const adminCreateArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        slug: z.string().min(3),
        title: z.string().min(3),
        summary: z.string().optional(),
        body: z.string().default(""),
        category_id: z.string().uuid().optional().nullable(),
        cover_url: z.string().optional().nullable(),
        reading_minutes: z.number().int().min(1).max(120).default(5),
        author_name: z.string().optional().nullable(),
        tags: z.array(z.string()).default([]),
        audience: z.enum(["family", "professional", "caregiver", "both"]).default("both"),
        publish: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: role } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!role) throw new Error("forbidden");
    const { error } = await supabase.from("library_articles").insert({
      slug: data.slug,
      title: data.title,
      summary: data.summary ?? null,
      body: data.body,
      category_id: data.category_id ?? null,
      cover_url: data.cover_url ?? null,
      reading_minutes: data.reading_minutes,
      author_name: data.author_name ?? null,
      tags: data.tags,
      audience: data.audience,
      published_at: data.publish ? new Date().toISOString() : null,
      created_by: userId,
    });
    if (error) throw error;
    return { ok: true };
  });
