"use client";

import { useWorkoutSession } from "@/components/gym/session-context";

/** Counts only what's staged this visit — a session already saved (even
 * moments ago) is history, not something that keeps counting toward
 * "done" here. Every fresh visit starts at 0. */
export function SessionProgress({ totalSets }: { totalSets: number }) {
  const { pending } = useWorkoutSession();

  return (
    <p className="text-sm text-zinc-400">
      {Object.keys(pending).length}/{totalSets} sets logged this visit
    </p>
  );
}
