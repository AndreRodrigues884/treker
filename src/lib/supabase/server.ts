import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Supabase client for use in Server Components, Route Handlers, and Server
 * Actions. Must be created per-request (it reads the current request's
 * cookies) — never module-level singleton this one.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `setAll` is called from a Server Component during render,
            // where cookies can't be written. Safe to ignore as long as
            // the session is also refreshed in middleware.ts.
          }
        },
      },
    },
  );
}
