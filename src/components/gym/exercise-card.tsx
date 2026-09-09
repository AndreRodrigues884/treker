"use client";

import { useActionState, useState } from "react";
import {
  lastSessionBefore,
  progressHistory,
  setsForDate,
  todayISO,
} from "@/lib/gym/derive";
import type { Exercise, ExerciseSet } from "@/lib/gym/queries";
import { saveSetAction, deleteExerciseAction } from "@/lib/actions/gym";
import { EXECUTION_TYPES, DIFFICULTIES } from "@/lib/constants/gym";
import type {
  ExecutionType,
  SetDifficulty,
  MuscleGroup,
} from "@/lib/constants/gym";
import { ExerciseForm } from "@/components/gym/exercise-form";
import { ProgressChart } from "@/components/gym/progress-chart";
import { PencilIcon, TrashIcon, SpinnerIcon } from "@/components/ui/icons";
import { updateExerciseAction } from "@/lib/actions/gym";

export function ExerciseCard({
  exercise,
  sets,
  muscleGroup,
}: {
  exercise: Exercise;
  sets: ExerciseSet[];
  muscleGroup: MuscleGroup;
}) {
  const [editing, setEditing] = useState(false);
  const [activeSet, setActiveSet] = useState(1);
  const [syncedSet, setSyncedSet] = useState(1);

  const today = todayISO();
  const todaySets = setsForDate(sets, today);
  const lastSession = lastSessionBefore(sets, today);
  const progress = progressHistory(sets, exercise.tracks_load);

  function findTodaySet(setNumber: number) {
    return todaySets.find((s) => s.set_number === setNumber);
  }
  function findLastSet(setNumber: number) {
    return lastSession?.find((s) => s.set_number === setNumber);
  }
  function weightFor(setNumber: number) {
    const t = findTodaySet(setNumber);
    if (t?.weight_kg != null) return String(t.weight_kg);
    const l = findLastSet(setNumber);
    if (l?.weight_kg != null) return String(l.weight_kg);
    return "";
  }
  function repsFor(setNumber: number) {
    return String(findTodaySet(setNumber)?.reps ?? exercise.reps);
  }
  function executionTypeFor(setNumber: number): ExecutionType {
    return findTodaySet(setNumber)?.execution_type ?? "straight";
  }
  function difficultyFor(setNumber: number): SetDifficulty {
    return findTodaySet(setNumber)?.difficulty ?? "medium";
  }

  const [weight, setWeight] = useState(() => weightFor(activeSet));
  const [reps, setReps] = useState(() => repsFor(activeSet));
  const [executionType, setExecutionType] = useState<ExecutionType>(() =>
    executionTypeFor(activeSet),
  );
  const [difficulty, setDifficulty] = useState<SetDifficulty>(() =>
    difficultyFor(activeSet),
  );

  // Switching sets should reset the inputs to that set's own saved/last
  // values, not carry over whatever was typed for the previous set. This
  // adjusts state during render (React's recommended alternative to an
  // effect for "reset derived state when a key changes") instead of an
  // effect that would commit a stale render first, then correct it.
  if (activeSet !== syncedSet) {
    setSyncedSet(activeSet);
    setWeight(weightFor(activeSet));
    setReps(repsFor(activeSet));
    setExecutionType(executionTypeFor(activeSet));
    setDifficulty(difficultyFor(activeSet));
  }

  const lastSetForActive = findLastSet(activeSet);

  const [state, formAction, pending] = useActionState(saveSetAction, null);

  if (editing) {
    return (
      <ExerciseForm
        action={updateExerciseAction.bind(null, exercise.id)}
        muscleGroup={muscleGroup}
        defaultValues={{
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          tracksLoad: exercise.tracks_load,
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
        <div className="flex items-center gap-3 text-zinc-500">
          <span className="text-sm">
            {todaySets.length}/{exercise.sets}
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
      </div>

      <div className="flex gap-2">
        {Array.from({ length: exercise.sets }, (_, i) => i + 1).map((n) => {
          const done = todaySets.some((s) => s.set_number === n);
          const active = n === activeSet;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setActiveSet(n)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition ${
                active
                  ? "border-indigo-400 bg-indigo-500/10 text-indigo-300"
                  : done
                    ? "border-emerald-800 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

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

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="exerciseId" value={exercise.id} />
        <input type="hidden" name="setNumber" value={activeSet} />
        <input type="hidden" name="muscleGroup" value={muscleGroup} />
        <input type="hidden" name="executionType" value={executionType} />
        <input type="hidden" name="difficulty" value={difficulty} />

        <div
          className={`grid gap-3 ${exercise.tracks_load ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {exercise.tracks_load && (
            <label className="space-y-1 text-sm text-zinc-400">
              Weight (kg)
              <input
                name="weightKg"
                type="number"
                step="0.5"
                min={0}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-400"
              />
            </label>
          )}
          <label className="space-y-1 text-sm text-zinc-400">
            Reps done
            <input
              name="reps"
              type="number"
              min={0}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-400"
            />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Execution type</p>
          <div className="grid grid-cols-3 gap-2">
            {EXECUTION_TYPES.map((et) => (
              <button
                key={et.value}
                type="button"
                onClick={() => setExecutionType(et.value)}
                className={`rounded-lg border px-2 py-2 text-sm transition ${
                  executionType === et.value
                    ? "border-indigo-400 bg-indigo-500/10 text-indigo-300"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {et.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
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
          <button
            type="submit"
            disabled={pending}
            className="flex items-center justify-center gap-1 rounded-lg bg-cyan-500 text-sm font-semibold text-zinc-950 transition hover:brightness-110 disabled:opacity-50"
          >
            {pending && <SpinnerIcon className="h-4 w-4" />}
            {pending ? "…" : "OK"}
          </button>
        </div>

        {state?.status === "error" && (
          <p role="alert" className="text-sm text-red-400">
            {state.message}
          </p>
        )}
      </form>

      <ProgressChart points={progress} unit={exercise.tracks_load ? "kg" : ""} />
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
