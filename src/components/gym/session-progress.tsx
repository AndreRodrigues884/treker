"use client";

import { useWorkoutSession } from "@/components/gym/session-context";

/** Unions today's already-saved sets with whatever's staged this visit,
 * so the count moves the moment you hit OK — even before Save session. */
export function SessionProgress({
  todaySetKeys,
  totalSets,
}: {
  todaySetKeys: string[];
  totalSets: number;
}) {
  const { pending } = useWorkoutSession();
  const combined = new Set([...todaySetKeys, ...Object.keys(pending)]);

  return (
    <p className="text-sm text-zinc-400">
      {combined.size}/{totalSets} sets logged today
    </p>
  );
}
