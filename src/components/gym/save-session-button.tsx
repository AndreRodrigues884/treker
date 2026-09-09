"use client";

import { useActionState } from "react";
import { useWorkoutSession } from "@/components/gym/session-context";
import { saveSessionAction, type GymFormResult } from "@/lib/actions/gym";
import { SpinnerIcon } from "@/components/ui/icons";
import type { MuscleGroup } from "@/lib/constants/gym";

export function SaveSessionButton({ muscleGroup }: { muscleGroup: MuscleGroup }) {
  const { pending, clearPending } = useWorkoutSession();
  const count = Object.keys(pending).length;

  const [state, formAction, isPending] = useActionState(
    async (prevState: GymFormResult, formData: FormData) => {
      const result = await saveSessionAction(muscleGroup, pending, prevState, formData);
      if (result?.status === "success") clearPending();
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <button
        type="submit"
        disabled={isPending || count === 0}
        className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:brightness-110 disabled:opacity-40"
      >
        {isPending && <SpinnerIcon className="h-4 w-4" />}
        {isPending ? "Saving…" : "Save session"}
      </button>
      {state?.status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}
    </form>
  );
}
