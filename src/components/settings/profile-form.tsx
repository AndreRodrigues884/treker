"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileResult } from "@/lib/actions/profile";
import { TextField } from "@/components/ui/text-field";
import { UserIcon, SpinnerIcon, CheckIcon } from "@/components/ui/icons";

const initialState: ProfileResult = null;

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="max-w-sm space-y-5">
      <TextField
        label="Name"
        icon={<UserIcon />}
        name="name"
        type="text"
        required
        autoComplete="name"
        defaultValue={defaultName}
        placeholder="How should we greet you?"
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
          Profile updated.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {pending && <SpinnerIcon className="h-4 w-4" />}
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
