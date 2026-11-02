"use client";

import { useActionState } from "react";
import { requestEmailChangeAction, type EmailChangeResult } from "@/lib/actions/profile";
import { TextField } from "@/components/ui/text-field";
import { MailIcon, SpinnerIcon, CheckIcon } from "@/components/ui/icons";

const initialState: EmailChangeResult = null;

/** Doesn't change the email on submit — Supabase emails a confirmation
 * link to the new address first, and the account keeps its current
 * email until that's clicked. The form stays on the "check your
 * inbox" message after a successful request rather than clearing
 * back to the old email, since nothing has actually changed yet. */
export function EmailChangeForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, pending] = useActionState(
    requestEmailChangeAction,
    initialState,
  );

  return (
    <form action={formAction} className="max-w-sm space-y-5">
      <TextField
        label="Current email"
        icon={<MailIcon />}
        type="email"
        value={currentEmail}
        disabled
        readOnly
      />
      <TextField
        label="New email"
        icon={<MailIcon />}
        name="newEmail"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
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
          className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400"
        >
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Check {state.newEmail} for a confirmation link — your email won&apos;t change
            until you click it.
          </span>
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {pending && <SpinnerIcon className="h-4 w-4" />}
        {pending ? "Sending…" : "Send confirmation"}
      </button>
    </form>
  );
}
