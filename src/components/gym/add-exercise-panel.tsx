"use client";

import { useState } from "react";
import { ExerciseForm } from "@/components/gym/exercise-form";
import { createExerciseAction } from "@/lib/actions/gym";
import { PlusIcon } from "@/components/ui/icons";
import type { MuscleGroup } from "@/lib/constants/gym";

export function AddExercisePanel({
  muscleGroup,
  routines,
}: {
  muscleGroup: MuscleGroup;
  routines: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-slate-600 px-4 py-3 text-sm text-zinc-400 transition hover:border-slate-400 hover:text-zinc-200"
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
      routines={routines}
      onSuccess={() => setOpen(false)}
      onCancel={() => setOpen(false)}
    />
  );
}
