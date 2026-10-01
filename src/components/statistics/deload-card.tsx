"use client";

import { useState, useTransition } from "react";
import { acknowledgeDeloadAction } from "@/lib/actions/gym";
import type { DeloadExercise } from "@/lib/gym/derive";
import { SpinnerIcon } from "@/components/ui/icons";

/** One card per plateaued exercise with a lighter-session suggestion
 * and a "Done" button — clicking it means the user did that session,
 * so it drops out of the list immediately (optimistic) and stays out
 * server-side until a new set is logged for that exercise. */
export function DeloadCard({ exercises }: { exercises: DeloadExercise[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const visible = exercises.filter((e) => !dismissed.has(e.exerciseId));

  if (visible.length === 0) {
    return <p className="text-sm text-zinc-500">No plateaus detected — keep it up.</p>;
  }

  return (
    <ul className="space-y-2">
      {visible.map((e) => {
        const { suggestion } = e;
        return (
          <li
            key={e.exerciseId}
            className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3"
          >
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-amber-300">
                <span aria-hidden>⚠️</span> {e.exerciseName}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Try a lighter session: {suggestion.sets} sets × {suggestion.reps} reps
                {suggestion.weightKg != null && <> @ {suggestion.weightKg}kg</>}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setDismissed((prev) => new Set(prev).add(e.exerciseId));
                startTransition(() => acknowledgeDeloadAction(e.exerciseId));
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/30 px-2.5 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-50"
            >
              {pending && <SpinnerIcon className="h-3 w-3" />}
              Done
            </button>
          </li>
        );
      })}
    </ul>
  );
}
