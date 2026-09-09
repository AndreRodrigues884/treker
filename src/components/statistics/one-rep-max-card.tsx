"use client";

import { useState } from "react";
import { ProgressChart } from "@/components/gym/progress-chart";
import type { ProgressPoint } from "@/lib/gym/derive";

const AMBER = "#fbbf24";

export type ExerciseOneRepMaxHistory = {
  exerciseId: string;
  exerciseName: string;
  history: ProgressPoint[];
};

export function OneRepMaxCard({
  exercises,
}: {
  exercises: ExerciseOneRepMaxHistory[];
}) {
  const [selectedId, setSelectedId] = useState(exercises[0]?.exerciseId);
  const selected = exercises.find((e) => e.exerciseId === selectedId);

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div>
        <h2 className="font-semibold text-zinc-100">1RM Estimado</h2>
        <p className="text-xs text-zinc-500">
          Fórmula Epley · peso × (1 + reps/30)
        </p>
      </div>

      {!selected ? (
        <p className="text-sm text-zinc-500">
          Log some weighted sets to see this.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {exercises.map((e) => (
              <button
                key={e.exerciseId}
                type="button"
                onClick={() => setSelectedId(e.exerciseId)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  e.exerciseId === selected.exerciseId
                    ? "border-zinc-100 bg-zinc-100 text-zinc-950"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {e.exerciseName}
              </button>
            ))}
          </div>

          <div className="flex gap-6">
            <div>
              <p className="text-xs text-zinc-500">Current</p>
              <p className="text-xl font-bold text-amber-400">
                {(selected.history.at(-1)?.value ?? 0).toFixed(1)} kg
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">All-time best</p>
              <p className="text-xl font-bold text-zinc-100">
                {Math.max(...selected.history.map((p) => p.value)).toFixed(1)}{" "}
                kg
              </p>
            </div>
          </div>

          <ProgressChart points={selected.history} unit="kg" color={AMBER} />
        </>
      )}
    </div>
  );
}
