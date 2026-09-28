import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getPostAuthPath } from "@/lib/auth/redirect";
import { env } from "@/lib/env";

/** Where Google sends the user back to after they approve the login —
 * exchanges the OAuth `code` for a real Supabase session.
 *
 * Builds the cookies directly onto the one NextResponse this handler
 * returns, the same request/response pair pattern proxy.ts's
 * updateSession uses — rather than going through the shared
 * lib/supabase/server.ts helper (which sets cookies via next/headers'
 * ambient cookies()). That helper is meant for Server Components/
 * Actions; here the write needs to land on this exact redirect for the
 * very next navigation to see it. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  let redirectTo = "/login?error=google";
  let pendingCookies: { name: string; value: string; options: CookieOptions }[] = [];

  if (code) {
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            pendingCookies = cookiesToSet;
          },
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      redirectTo = await getPostAuthPath(data.user.id);
    }
  }

  const response = NextResponse.redirect(`${origin}${redirectTo}`);
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }
  return response;
}
