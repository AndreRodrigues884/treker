"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon } from "@/components/ui/icons";
import type { MuscleGroupOption } from "@/lib/constants/gym";
import { MuscleGroupIcon } from "@/components/gym/muscle-group-icon";

export function AddMuscleGroupButton({
  remaining,
}: {
  remaining: readonly MuscleGroupOption[];
}) {
  const [open, setOpen] = useState(false);

  if (remaining.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 px-4 py-6 text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
      >
        <PlusIcon className="h-6 w-6" />
        <span className="text-sm font-medium">Add muscle group</span>
      </button>
    );
  }

  return (
    <div className="col-span-full space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-300">
          Pick a muscle group
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {remaining.map((m) => (
          <Link
            key={m.value}
            href={`/dashboard/gym/${m.value}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 px-4 py-4 text-center transition hover:border-zinc-600"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.tint}`}
            >
              <MuscleGroupIcon group={m.value} className="h-5 w-5" />
            </span>
            <span className="text-sm text-zinc-200">{m.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
