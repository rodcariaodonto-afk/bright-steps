import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, boolean>();
const listeners = new Map<string, Set<(v: boolean) => void>>();
let channel: ReturnType<typeof supabase.channel> | null = null;
let bootstrapped = false;

function notify(key: string, enabled: boolean) {
  cache.set(key, enabled);
  listeners.get(key)?.forEach((cb) => cb(enabled));
}

async function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;
  const { data } = await supabase.from("feature_flags").select("key, enabled");
  (data ?? []).forEach((f: any) => notify(f.key, !!f.enabled));

  channel = supabase
    .channel(`feature_flags-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "feature_flags" },
      (payload: any) => {
        const row = (payload.new ?? payload.old) as any;
        if (row?.key) notify(row.key, !!row.enabled);
      },
    )
    .subscribe();
}

export function useFeatureFlag(key: string, defaultValue = true): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => cache.get(key) ?? defaultValue);

  useEffect(() => {
    bootstrap();
    let set = listeners.get(key);
    if (!set) { set = new Set(); listeners.set(key, set); }
    set.add(setEnabled);
    if (cache.has(key)) setEnabled(cache.get(key)!);
    return () => { set!.delete(setEnabled); };
  }, [key]);

  return enabled;
}
