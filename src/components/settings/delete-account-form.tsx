"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction, type DeleteAccountResult } from "@/lib/actions/profile";
import { SpinnerIcon } from "@/components/ui/icons";

const initialState: DeleteAccountResult = null;

const CONFIRM_WORD = "DELETE";

/** Confirmed by typing DELETE rather than re-entering a password — a
 * Google-signed-in account has no password to re-enter, so a text
 * match is the one confirmation that works the same for every sign-in
 * method. On success the action redirects straight to /login itself
 * (there's no page left to show a "done" state on), so this only ever
 * has an error state to render. */
export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteAccountAction, initialState);
  const [confirmation, setConfirmation] = useState("");

  return (
    <div className="max-w-sm space-y-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
      <div>
        <h3 className="text-sm font-semibold text-red-300">Delete account</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Permanently removes your account and everything you&apos;ve logged —
          every workout, run, swim time, PR, and goal. This can&apos;t be undone.
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">
            Type <span className="font-mono font-semibold text-zinc-300">{CONFIRM_WORD}</span> to
            confirm
          </span>
          <input
            name="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-400"
          />
        </label>

        {state?.status === "error" && (
          <p role="alert" className="text-sm text-red-400">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || confirmation !== CONFIRM_WORD}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
        >
          {pending && <SpinnerIcon className="h-4 w-4" />}
          {pending ? "Deleting…" : "Delete my account"}
        </button>
      </form>
    </div>
  );
}
