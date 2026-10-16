"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, passwordChangeSchema, bodyMetricsSchema } from "@/lib/validation/profile";

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

/** A simple on/off preference, also stored on the auth user's metadata —
 * there's no notification-sending system behind this yet, so this just
 * records the choice for when there is one. */
export async function updateNotificationsAction(enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { notifications_enabled: enabled },
  });
  if (error) {
    throw new Error(error.message);
  }
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
