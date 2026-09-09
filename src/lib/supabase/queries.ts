import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * `cache()` dedupes repeated calls within the same request/render pass —
 * layout.tsx and page.tsx can both call these without doubling the
 * network round-trip to Supabase.
 */

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  // getSession() reads the already-verified cookie with no network call —
  // safe here specifically because src/proxy.ts already called getUser()
  // (which does hit the Auth server) on this very request, before it ever
  // reached this render. Using getUser() again here would just repeat
  // that same network round-trip on every single navigation.
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
});

export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
});

export type Profile = Tables<"profiles">;
