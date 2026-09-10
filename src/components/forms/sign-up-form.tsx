"use client";

import { useActionState } from "react";
import { signUpAction, type SignUpResult } from "@/lib/actions/auth";
import { TextField, PasswordField } from "@/components/ui/text-field";
import { MailIcon, LockIcon, UserIcon, SpinnerIcon } from "@/components/ui/icons";

const initialState: SignUpResult = null;

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialState,
  );

  if (state?.status === "check-email") {
    return (
      <p role="status" className="text-center text-sm text-zinc-300">
        Check your email to confirm your account, then log in.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <TextField
        label="Name (optional)"
        icon={<UserIcon />}
        name="name"
        type="text"
        autoComplete="name"
        placeholder="How should we greet you?"
      />
      <TextField
        label="Email"
        icon={<MailIcon />}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
      />
      <PasswordField
        label="Password"
        icon={<LockIcon />}
        name="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />

      {state?.status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-110 disabled:opacity-50"
      >
        {pending && <SpinnerIcon className="h-4 w-4" />}
        {pending ? "Creating account…" : "Sign up"}
      </button>
    </form>
  );
}
