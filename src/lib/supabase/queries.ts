import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

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
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  // A real error (missing table, RLS misconfigured, network) is not the
  // same thing as "no profile row yet" (a brand new user) — treating
  // both as null silently sent users to onboarding or dashboard
  // unpredictably depending on which query happened to fail. Throwing
  // surfaces it as a visible error page instead.
  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return data;
});

// Profile row type now lives in src/types/profile.ts — import it from
// there, not from here.

/** The name set from Settings > Profile, stored on the auth user's own
 * metadata rather than a profiles column — every signed-in user can
 * already update this for themselves, no RLS/migration needed. `null`
 * until they set one, so callers fall back to email. */
export function getDisplayName(user: User): string | null {
  const name = user.user_metadata?.full_name;
  return typeof name === "string" && name.trim() ? name : null;
}

export function getNotificationsEnabled(user: User): boolean {
  const value = user.user_metadata?.notifications_enabled;
  return typeof value === "boolean" ? value : true;
}
