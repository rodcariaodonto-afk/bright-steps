import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Response("Forbidden", { status: 403 });
}

export const listPersonaSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("ai_persona_settings" as any)
      .select("*")
      .order("persona_id");
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

export const updatePersonaSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      persona_id: string;
      model: string;
      extra_instructions: string;
      temperature: number;
      enabled: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("ai_persona_settings" as any)
      .update({
        model: data.model,
        extra_instructions: data.extra_instructions,
        temperature: data.temperature,
        enabled: data.enabled,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      })
      .eq("persona_id", data.persona_id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "ai.persona.update",
      target_type: "persona",
      target_id: data.persona_id,
      metadata: { model: data.model, enabled: data.enabled },
    });
    return { ok: true };
  });

export const testPersona = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { persona_id: string; prompt: string }) => input)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    const { data: settings } = await context.supabase
      .from("ai_persona_settings" as any)
      .select("*")
      .eq("persona_id", data.persona_id)
      .maybeSingle();

    const model = (settings as any)?.model ?? "google/gemini-3.5-flash";
    const extra = (settings as any)?.extra_instructions ?? "";

    const { generateText } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const { getPersona } = await import("@/modules/ai/personas");

    const persona = getPersona(data.persona_id as any);
    const system = persona.systemPrompt({ authorizedContext: "(playground admin)", memory: "" });
    const finalSystem = extra ? `${system}\n\nINSTRUÇÕES EXTRAS (admin):\n${extra}` : system;

    const gateway = createLovableAiGatewayProvider(apiKey);
    const started = Date.now();
    const { text } = await generateText({
      model: gateway(model),
      system: finalSystem,
      prompt: data.prompt,
    });
    return { text, model, latencyMs: Date.now() - started };
  });

export const listAiActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_audit_log")
      .select("id, actor_id, action, target_id, metadata, created_at")
      .like("action", "ai.%")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
