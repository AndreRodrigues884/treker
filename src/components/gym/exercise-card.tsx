"use client";

import { useState } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import { mostRecentSession } from "@/lib/gym/derive";
import type { Exercise, ExerciseSet } from "@/types/gym";
import { deleteExerciseAction, updateExerciseAction } from "@/lib/actions/gym";
import { DIFFICULTIES } from "@/lib/constants/gym";
import type { SetDifficulty, MuscleGroup } from "@/lib/constants/gym";
import { ExerciseForm } from "@/components/gym/exercise-form";
import { useWorkoutSession } from "@/components/gym/session-context";
import { GripIcon, PencilIcon, TrashIcon } from "@/components/ui/icons";

export function ExerciseCard({
  exercise,
  sets,
  muscleGroup,
  routines,
  dragHandle,
}: {
  exercise: Exercise;
  sets: ExerciseSet[];
  muscleGroup: MuscleGroup;
  routines: { id: string; name: string }[];
  /** Attributes/listeners from dnd-kit's useSortable, spread onto the
   * grip button — omitted where the card isn't inside a sortable list. */
  dragHandle?: {
    attributes: DraggableAttributes;
    listeners: DraggableSyntheticListeners;
  };
}) {
  const { pending, getPendingSet, setPendingSet } = useWorkoutSession();

  const [editing, setEditing] = useState(false);
  // Collapsed by default — opening a set number is what reveals the rest.
  const [activeSet, setActiveSet] = useState<number | null>(null);
  const [syncedSet, setSyncedSet] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Once a session is saved, it's just history — "last time" always
  // means the most recent saved session, even if that was today, and
  // every fresh visit starts fully unfilled. There's no more special
  // "already done today" state that pre-fills or blocks re-entry.
  const lastSession = mostRecentSession(sets);
  const pendingCountForExercise = Object.keys(pending).filter((key) =>
    key.startsWith(`${exercise.id}:`),
  ).length;

  function findLastSet(setNumber: number) {
    return lastSession?.find((s) => s.set_number === setNumber);
  }
  // Always empty unless staged this visit — last time's numbers only
  // ever show as the placeholder below, never pre-filled, so confirming
  // a set takes a conscious keystroke instead of silently resubmitting
  // old data.
  function weightFor(setNumber: number) {
    const p = getPendingSet(exercise.id, setNumber);
    return p?.weightKg != null ? String(p.weightKg) : "";
  }
  function repsFor(setNumber: number) {
    const p = getPendingSet(exercise.id, setNumber);
    return p ? String(p.reps) : "";
  }
  function difficultyFor(setNumber: number): SetDifficulty {
    return getPendingSet(exercise.id, setNumber)?.difficulty ?? "medium";
  }

  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState(String(exercise.reps));
  const [difficulty, setDifficulty] = useState<SetDifficulty>("medium");

  // Adjust state during render when the selected set changes — React's
  // recommended alternative to an effect for this ("reset derived state
  // when a key changes") avoids committing a stale render first.
  if (activeSet !== syncedSet) {
    setSyncedSet(activeSet);
    if (activeSet !== null) {
      setWeight(weightFor(activeSet));
      setReps(repsFor(activeSet));
      setDifficulty(difficultyFor(activeSet));
    }
    setError(null);
  }

  const lastSetForActive = activeSet !== null ? findLastSet(activeSet) : undefined;

  function handleToggleSet(n: number) {
    setActiveSet(activeSet === n ? null : n);
  }

  function handleCancel() {
    // Nothing was ever written to pending/today from the inputs below —
    // closing just discards whatever was typed. Reopening this same set
    // re-derives fresh values (see the render-time sync above), so
    // there's nothing else to "reset" explicitly.
    setError(null);
    setActiveSet(null);
  }

  function handleConfirm() {
    if (activeSet === null) return;
    if (reps.trim() === "") {
      setError("Enter the reps you did.");
      return;
    }
    const parsedReps = Number(reps);
    if (!Number.isInteger(parsedReps) || parsedReps < 0) {
      setError("Enter a valid number of reps.");
      return;
    }
    let parsedWeight: number | null = null;
    if (exercise.tracks_load) {
      if (weight.trim() !== "") {
        parsedWeight = Number(weight);
        if (Number.isNaN(parsedWeight) || parsedWeight < 0) {
          setError("Enter a valid weight.");
          return;
        }
      }
    }
    setError(null);
    setPendingSet(exercise.id, activeSet, {
      weightKg: parsedWeight,
      reps: parsedReps,
      executionType: "straight",
      difficulty,
    });
    setActiveSet(null);
  }

  if (editing) {
    return (
      <ExerciseForm
        action={updateExerciseAction.bind(null, exercise.id)}
        muscleGroup={muscleGroup}
        routines={routines}
        defaultValues={{
          routineId: exercise.routine_id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          tracksLoad: exercise.tracks_load,
          track1rm: exercise.track_1rm,
        }}
        submitLabel="Save changes"
        onCancel={() => setEditing(false)}
        onSuccess={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-zinc-100">{exercise.name}</h3>
          <p className="text-sm text-zinc-500">
            {exercise.sets} × {exercise.reps} reps
          </p>
        </div>
        <div className="flex flex-col items-end gap-6 text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="text-sm">
              {pendingCountForExercise}/{exercise.sets}
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit exercise"
              className="hover:text-zinc-200"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <form action={deleteExerciseAction}>
              <input type="hidden" name="exerciseId" value={exercise.id} />
              <input type="hidden" name="muscleGroup" value={muscleGroup} />
              <button
                type="submit"
                aria-label="Delete exercise"
                className="hover:text-red-400"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
          {dragHandle && (
            <button
              type="button"
              {...dragHandle.attributes}
              {...dragHandle.listeners}
              aria-label="Drag to reorder"
              className="touch-none hover:text-zinc-300"
            >
              <GripIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: exercise.sets }, (_, i) => i + 1).map((n) => {
          const staged = !!getPendingSet(exercise.id, n);
          const active = n === activeSet;
          return (
            <button
              key={n}
              type="button"
              onClick={() => handleToggleSet(n)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition ${
                active
                  ? "border-indigo-400 bg-indigo-500/10 text-indigo-300"
                  : staged
                    ? "border-amber-700 bg-amber-500/10 text-amber-400"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

      {activeSet !== null && (
        <div className="space-y-4">
          <div className="h-px bg-zinc-800" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Set {activeSet}</span>
            {lastSetForActive && (
              <span className="flex items-center gap-2 text-indigo-300">
                Last time:{" "}
                {exercise.tracks_load && lastSetForActive.weight_kg != null
                  ? `${lastSetForActive.weight_kg}kg · `
                  : ""}
                {lastSetForActive.reps} reps
                <DifficultyPill value={lastSetForActive.difficulty} />
              </span>
            )}
          </div>

          <div
            className={`grid gap-3 ${exercise.tracks_load ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {exercise.tracks_load && (
              <label className="space-y-1 text-sm text-zinc-400">
                Weight (kg)
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={
                    lastSetForActive?.weight_kg != null
                      ? String(lastSetForActive.weight_kg)
                      : undefined
                  }
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-indigo-400"
                />
              </label>
            )}
            <label className="space-y-1 text-sm text-zinc-400">
              Reps done
              <input
                type="number"
                min={0}
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder={
                  lastSetForActive
                    ? String(lastSetForActive.reps)
                    : String(exercise.reps)
                }
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-indigo-400"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                className={`rounded-lg border px-2 py-2 text-sm transition ${
                  difficulty === d.value
                    ? `border-transparent ${d.tint}`
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-zinc-800 px-2 py-2 text-sm text-zinc-300 transition hover:border-zinc-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 rounded-lg bg-cyan-500 text-sm font-semibold text-zinc-950 transition hover:brightness-110"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DifficultyPill({ value }: { value: SetDifficulty }) {
  const entry = DIFFICULTIES.find((d) => d.value === value);
  if (!entry) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${entry.tint}`}>
      {entry.label}
    </span>
  );
}
