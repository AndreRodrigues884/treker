import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Service-role client — bypasses RLS entirely. Only for narrow,
 * trusted server-side operations the regular (RLS-bound) client
 * genuinely can't do, like deleting a user's own auth.users row
 * (`deleteAccountAction`). Never import this into anything reachable
 * from the client, and never widen its use beyond admin-only calls.
 */
export function createAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — required for admin-only operations like account deletion.",
    );
  }
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
