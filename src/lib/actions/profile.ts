"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  profileSchema,
  passwordChangeSchema,
  bodyMetricsSchema,
  emailChangeSchema,
} from "@/lib/validation/profile";

export type ProfileResult =
  | { status: "error"; message: string }
  | { status: "success" }
  | null;

/** Name lives on the auth user's own metadata (auth.updateUser), not a
 * profiles column — every signed-in user can already update this for
 * themselves with no extra RLS/migration needed. */
export async function updateProfileAction(
  _prevState: ProfileResult,
  formData: FormData,
): Promise<ProfileResult> {
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: parsed.data.name },
  });
  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard", "layout");
  return { status: "success" };
}

/** Bodyweight/height, kept on the profiles row as a single current
 * value — not a history, that feature was removed. Exists purely so
 * exercises marked "adds bodyweight" (e.g. weighted pull-ups) can
 * compute a real 1RM; it's used nowhere else. */
export async function updateBodyMetricsAction(
  _prevState: ProfileResult,
  formData: FormData,
): Promise<ProfileResult> {
  const parsed = bodyMetricsSchema.safeParse({
    bodyweightKg: formData.get("bodyweightKg"),
    heightCm: formData.get("heightCm"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({ bodyweight_kg: parsed.data.bodyweightKg, height_cm: parsed.data.heightCm })
    .eq("id", user.id);
  if (error) return { status: "error", message: error.message };

  revalidatePath("/dashboard", "layout");
  return { status: "success" };
}

export type PasswordChangeResult =
  | { status: "error"; message: string }
  | { status: "success" }
  | null;

export async function changePasswordAction(
  _prevState: PasswordChangeResult,
  formData: FormData,
): Promise<PasswordChangeResult> {
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { status: "error", message: "You need to be logged in." };
  }

  // Re-verify the current password before accepting a new one — an
  // active session alone (e.g. on a shared device) shouldn't be enough to
  // silently change it.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (signInError) {
    return { status: "error", message: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success" };
}

export type EmailChangeResult =
  | { status: "error"; message: string }
  | { status: "success"; newEmail: string }
  | null;

/** Doesn't change the email directly — Supabase sends a confirmation
 * link to the new address (and, with "secure email change" on, the old
 * one too) and the swap only takes effect once that's clicked. The
 * account keeps its current email until then, so there's no
 * "success" to show beyond "check your inbox". */
export async function requestEmailChangeAction(
  _prevState: EmailChangeResult,
  formData: FormData,
): Promise<EmailChangeResult> {
  const parsed = emailChangeSchema.safeParse({ newEmail: formData.get("newEmail") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  if (parsed.data.newEmail === user.email) {
    return { status: "error", message: "That's already your current email." };
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol =
    host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";

  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.newEmail },
    { emailRedirectTo: `${protocol}://${host}/dashboard/settings` },
  );
  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success", newEmail: parsed.data.newEmail };
}

export type DeleteAccountResult = { status: "error"; message: string } | null;

/**
 * Irreversible — deletes the auth.users row outright, which cascades
 * to every table of this user's data (every migration's user_id FK is
 * `on delete cascade`: exercises, sets, runs, swim times, PRs, goals,
 * all of it). Confirmed by typing DELETE rather than re-entering a
 * password: a Google-signed-in account has no password to re-enter, so
 * a text match is the one confirmation that works the same for every
 * sign-in method. Needs the service-role client (createAdminClient) —
 * deleting another auth.users row, even your own, isn't something the
 * regular RLS-bound client can do. Redirects straight to /login on
 * success instead of returning a state — there's no page left to show
 * a "done" message on once the account is gone.
 */
export async function deleteAccountAction(
  _prevState: DeleteAccountResult,
  formData: FormData,
): Promise<DeleteAccountResult> {
  if (formData.get("confirmation") !== "DELETE") {
    return { status: "error", message: 'Type "DELETE" to confirm.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return { status: "error", message: error.message };
  }

  await supabase.auth.signOut();
  redirect("/login");
}
