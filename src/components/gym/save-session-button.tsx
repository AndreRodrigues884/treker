"use client";

import { useActionState, useState } from "react";
import { useWorkoutSession } from "@/components/gym/session-context";
import { saveSessionAction, type GymFormResult, type PrAchieved } from "@/lib/actions/gym";
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

  // Each successful save produces a new `state` object — reacting to
  // that identity change during render (not in an effect) opens the
  // modal exactly once per save that earned something. The modal's own
  // "Done" button is what closes it after that.
  const [lastState, setLastState] = useState(state);
  const [showAchievements, setShowAchievements] = useState(false);
  if (state !== lastState) {
    setLastState(state);
    setShowAchievements(
      state?.status === "success" &&
        ((state.prs?.length ?? 0) > 0 || (state.milestonesKg?.length ?? 0) > 0),
    );
  }

  return (
    <>
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
      </form>

      {showAchievements && state?.status === "success" && (
        <AchievementsModal
          prs={state.prs ?? []}
          milestonesKg={state.milestonesKg ?? []}
          onClose={() => setShowAchievements(false)}
        />
      )}
    </>
  );
}

/** Real, earned recognition — a genuine PR or lifetime-volume milestone,
 * not an invented game mechanic — shown as its own centered modal
 * instead of an inline banner so it can't crowd or misalign the header
 * it used to live in. */
function AchievementsModal({
  prs,
  milestonesKg,
  onClose,
}: {
  prs: PrAchieved[];
  milestonesKg: number[];
  onClose: () => void;
}) {
  const title = prs.length > 0 ? "PRs achieved this session" : "Milestone reached!";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-amber-500/30 bg-slate-800 p-5 shadow-2xl">
        <h2 className="text-base font-bold text-zinc-100">{title}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {prs.map((pr, i) => (
            <li key={`pr-${i}`} className="text-amber-300">
              🎉{" "}
              <span className="font-semibold text-amber-200">{pr.exerciseName}</span>{" "}
              — {pr.weightKg}kg × {pr.reps} (1RM est. {pr.oneRepMax.toFixed(1)}kg)
            </li>
          ))}
          {milestonesKg.map((kg) => (
            <li key={`milestone-${kg}`} className="text-amber-300">
              🏆 {kg.toLocaleString()}kg lifted in total
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:brightness-110"
        >
          Done
        </button>
      </div>
    </div>
  );
}
