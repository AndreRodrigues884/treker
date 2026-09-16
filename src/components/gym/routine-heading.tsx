"use client";

import { useState, useTransition } from "react";
import { renameRoutineAction } from "@/lib/actions/gym";
import { PencilIcon, SpinnerIcon } from "@/components/ui/icons";
import type { MuscleGroup } from "@/lib/constants/gym";

export function RoutineHeading({
  routineId,
  muscleGroup,
  name,
}: {
  routineId: string;
  muscleGroup: MuscleGroup;
  name: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-zinc-200">{name}</h2>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Rename workout"
          className="text-zinc-500 hover:text-zinc-300"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await renameRoutineAction(routineId, muscleGroup, trimmed);
      setEditing(false);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-indigo-400"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
      >
        {pending && <SpinnerIcon className="h-3 w-3" />}
        Save
      </button>
      <button
        type="button"
        onClick={() => {
          setValue(name);
          setEditing(false);
        }}
        className="text-xs text-zinc-500 hover:text-zinc-300"
      >
        Cancel
      </button>
    </div>
  );
}
