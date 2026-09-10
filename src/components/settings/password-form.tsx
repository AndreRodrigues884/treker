"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  type PasswordChangeResult,
} from "@/lib/actions/profile";
import { PasswordField } from "@/components/ui/text-field";
import { LockIcon, SpinnerIcon, CheckIcon } from "@/components/ui/icons";

const initialState: PasswordChangeResult = null;

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      key={state?.status === "success" ? "done" : "editing"}
      className="max-w-sm space-y-5"
    >
      <PasswordField
        label="Current password"
        icon={<LockIcon />}
        name="currentPassword"
        required
        autoComplete="current-password"
        placeholder="••••••••"
      />
      <PasswordField
        label="New password"
        icon={<LockIcon />}
        name="newPassword"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <PasswordField
        label="Confirm new password"
        icon={<LockIcon />}
        name="confirmPassword"
        required
        autoComplete="new-password"
        placeholder="Repeat the new password"
      />

      {state?.status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {state.message}
        </p>
      )}
      {state?.status === "success" && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400"
        >
          <CheckIcon className="h-4 w-4" />
          Password changed.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {pending && <SpinnerIcon className="h-4 w-4" />}
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
