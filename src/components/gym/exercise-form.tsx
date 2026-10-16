"use client";

import { useActionState, useEffect, useState } from "react";
import type { GymFormResult } from "@/lib/actions/gym";
import { SpinnerIcon } from "@/components/ui/icons";
import {
  EXERCISE_UNITS,
  NEW_ROUTINE,
  type ExerciseUnit,
  type MuscleGroup,
} from "@/lib/constants/gym";

const initialState: GymFormResult = null;

export function ExerciseForm({
  action,
  muscleGroup,
  routines,
  defaultValues,
  submitLabel = "Add exercise",
  onCancel,
  onSuccess,
}: {
  action: (prevState: GymFormResult, formData: FormData) => Promise<GymFormResult>;
  muscleGroup: MuscleGroup;
  /** Every routine for this muscle group — shown as the workout picker
   * in both create and edit mode, so an exercise can move charts later. */
  routines: { id: string; name: string }[];
  defaultValues?: {
    routineId: string;
    name: string;
    sets: number;
    reps: number;
    unit: ExerciseUnit;
    tracksLoad: boolean;
    track1rm: boolean;
    addsBodyweight: boolean;
  };
  submitLabel?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [selectedRoutine, setSelectedRoutine] = useState(
    defaultValues?.routineId ?? routines[0]?.id ?? NEW_ROUTINE,
  );
  const [tracksLoad, setTracksLoad] = useState(defaultValues?.tracksLoad ?? true);
  const [unit, setUnit] = useState<ExerciseUnit>(defaultValues?.unit ?? "reps");

  useEffect(() => {
    if (state?.status === "success") onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800/60 p-4"
    >
      <input type="hidden" name="muscleGroup" value={muscleGroup} />

      <div className="space-y-1">
        <label htmlFor="routineId" className="text-sm text-zinc-400">
          Workout
        </label>
        <select
          id="routineId"
          name="routineId"
          value={selectedRoutine}
          onChange={(e) => setSelectedRoutine(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-400"
        >
          {routines.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
          <option value={NEW_ROUTINE}>+ Create new workout</option>
        </select>
        {selectedRoutine === NEW_ROUTINE && (
          <input
            name="newRoutineName"
            placeholder="e.g. Legs A"
            defaultValue={`Workout ${routines.length + 1}`}
            required
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-400"
          />
        )}
        <p className="text-xs text-zinc-500">
          Exercises in the same workout share one progress chart — create a
          new one for a different day&apos;s routine.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm text-zinc-400">
          Exercise name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-400"
        />
      </div>

      <div className="space-y-1">
        <span className="text-sm text-zinc-400">Measured in</span>
        <input type="hidden" name="unit" value={unit} />
        <div className="grid grid-cols-2 gap-2">
          {EXERCISE_UNITS.map((u) => (
            <button
              key={u.value}
              type="button"
              onClick={() => setUnit(u.value)}
              aria-pressed={unit === u.value}
              className={`rounded-lg border px-2 py-2 text-sm transition ${
                unit === u.value
                  ? "border-indigo-400 bg-indigo-500/10 text-indigo-300"
                  : "border-slate-700 text-zinc-400 hover:border-slate-500"
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          Seconds is for timed exercises — a plank or a dead hang, logged as
          a duration instead of a rep count.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="sets" className="text-sm text-zinc-400">
            Sets
          </label>
          <input
            id="sets"
            name="sets"
            type="number"
            min={1}
            max={20}
            defaultValue={defaultValues?.sets ?? 3}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-400"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="reps" className="text-sm text-zinc-400">
            {unit === "seconds" ? "Seconds" : "Reps"}
          </label>
          <input
            id="reps"
            name="reps"
            type="number"
            min={1}
            max={unit === "seconds" ? 600 : 100}
            defaultValue={defaultValues?.reps ?? (unit === "seconds" ? 30 : 10)}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          name="tracksLoad"
          checked={tracksLoad}
          onChange={(e) => setTracksLoad(e.target.checked)}
          className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-indigo-500"
        />
        Track weight for this exercise
      </label>

      {tracksLoad && unit === "reps" && (
        <>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              name="track1rm"
              defaultChecked={defaultValues?.track1rm ?? true}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-indigo-500"
            />
            Show this exercise in the 1RM Estimado chart
          </label>
          <label className="flex items-start gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              name="addsBodyweight"
              defaultChecked={defaultValues?.addsBodyweight ?? false}
              className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 accent-indigo-500"
            />
            <span>
              Weighted bodyweight exercise
              <span className="block text-xs text-zinc-500">
                e.g. weighted pull-ups/dips — the logged weight is on top of
                your bodyweight, not the whole load
              </span>
            </span>
          </label>
        </>
      )}

      {state?.status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-slate-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-linear-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {pending && <SpinnerIcon className="h-4 w-4" />}
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
