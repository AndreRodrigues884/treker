"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import { getPostAuthPath } from "@/lib/auth/redirect";

export type SignUpResult =
  | { status: "error"; message: string }
  | { status: "check-email" }
  | null;

export async function signUpAction(
  _prevState: SignUpResult,
  formData: FormData,
): Promise<SignUpResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);
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
