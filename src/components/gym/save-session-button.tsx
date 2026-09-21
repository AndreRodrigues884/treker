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

  const hasAchievements =
    state?.status === "success" &&
    ((state.prs?.length ?? 0) > 0 || (state.milestonesKg?.length ?? 0) > 0);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <button
        type="submit"
        disabled={isPending || count === 0}
        className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-semibold text-zinc-950 transition hover:brightness-110 disabled:opacity-40"
      >
        {isPending && <SpinnerIcon className="h-4 w-4" />}
        {isPending ? "Saving…" : "Save session"}
      </button>
      {state?.status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}
      {state?.status === "success" && state.warning && (
        <p role="alert" className="text-sm text-amber-400">
          {state.warning}
        </p>
      )}
      {/* Real, earned recognition — a genuine PR or lifetime-volume
       * milestone, not an invented game mechanic — so this only ever
       * shows up when saveSessionAction actually detected one. */}
      {hasAchievements && (
        <div
          role="status"
          className="w-72 max-w-[calc(100vw-2rem)] space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm"
        >
          {state.prs?.map((pr, i) => (
            <p key={`pr-${i}`} className="text-amber-300">
              🎉 New PR:{" "}
              <span className="font-semibold text-amber-200">{pr.exerciseName}</span>{" "}
              — {pr.weightKg}kg × {pr.reps} (1RM est. {pr.oneRepMax.toFixed(1)}kg)
            </p>
          ))}
          {state.milestonesKg?.map((kg) => (
            <p key={`milestone-${kg}`} className="text-amber-300">
              🏆 Milestone: {kg.toLocaleString()}kg lifted in total
            </p>
          ))}
        </div>
      )}
    </form>
  );
}
