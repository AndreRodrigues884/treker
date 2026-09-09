"use client";

import { useState } from "react";
import { ExerciseForm } from "@/components/gym/exercise-form";
import { createExerciseAction } from "@/lib/actions/gym";
import { PlusIcon } from "@/components/ui/icons";
import type { MuscleGroup } from "@/lib/constants/gym";

export function AddExercisePanel({ muscleGroup }: { muscleGroup: MuscleGroup }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
      >
        <PlusIcon className="h-4 w-4" />
        Add exercise
      </button>
    );
  }

  return (
    <ExerciseForm
      action={createExerciseAction}
      muscleGroup={muscleGroup}
      onSuccess={() => setOpen(false)}
      onCancel={() => setOpen(false)}
    />
  );
}
