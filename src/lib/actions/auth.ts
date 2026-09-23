"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import { getPostAuthPath } from "@/lib/auth/redirect";
import {
  getClientIp,
  isRateLimited,
  loginRateLimit,
  oauthRateLimit,
  signupRateLimit,
} from "@/lib/rate-limit";

export type SignUpResult =
  | { status: "error"; message: string }
  | { status: "check-email" }
  | null;

export async function signUpAction(
  _prevState: SignUpResult,
  formData: FormData,
): Promise<SignUpResult> {
  if (await isRateLimited(signupRateLimit, await getClientIp())) {
    return {
      status: "error",
      message: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    // Stored on the auth user itself (not the profiles table, which
    // doesn't exist yet at this point — it's only created during
    // onboarding), so it's already there by the time the dashboard needs
    // it for the greeting.
    options: parsed.data.name ? { data: { full_name: parsed.data.name } } : undefined,
  });
  if (error) {
    return { status: "error", message: error.message };
  }

  // Local dev has email confirmation disabled, so signUp() returns a
  // session immediately. In production (confirmation enabled) there is no
  // session yet — the user needs to click the confirmation link first.
  if (!data.session) {
    return { status: "check-email" };
  }

  redirect("/onboarding");
}

export type SignInResult = { status: "error"; message: string } | null;

export async function signInAction(
  _prevState: SignInResult,
  formData: FormData,
): Promise<SignInResult> {
  if (await isRateLimited(loginRateLimit, await getClientIp())) {
    return {
      status: "error",
      message: "Too many attempts. Please wait a moment and try again.",
    };
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { status: "error", message: "Invalid email or password." };
  }

  redirect(await getPostAuthPath(data.user.id));
}

/** Same flow for both login and signup — Google/OAuth doesn't
 * distinguish the two, the callback route sends a first-time user to
 * onboarding and a returning one straight to the dashboard, same as
 * signInAction does for email/password. */
export async function signInWithGoogleAction() {
  if (await isRateLimited(oauthRateLimit, await getClientIp())) {
    redirect("/login?error=rate_limit");
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${protocol}://${host}/auth/callback` },
  });
  if (error || !data.url) {
    redirect("/login?error=google");
  }

  redirect(data.url);
}
