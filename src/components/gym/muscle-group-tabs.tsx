"use client";

import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/constants/gym";
import { useWorkoutGuard } from "@/components/workout-guard";
import { MuscleGroupIcon } from "@/components/gym/muscle-group-icon";

/** Quick-switch row — only muscle groups that already have at least one
 * exercise (plus whichever one is active). Goes through the workout guard
 * (not a plain <Link>) because switching muscle group mid-session is the
 * most likely way to lose staged-but-unsaved sets by accident. */
export function MuscleGroupTabs({
  active,
  available,
}: {
  active: MuscleGroup;
  available: Set<MuscleGroup>;
}) {
  const { navigate } = useWorkoutGuard();
  const groups = MUSCLE_GROUPS.filter(
    (m) => available.has(m.value) || m.value === active,
  );

  if (groups.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {groups.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => navigate(`/dashboard/gym/${m.value}`)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
            m.value === active
              ? "border-indigo-400 bg-indigo-500/10 text-indigo-300"
              : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
          }`}
        >
          <MuscleGroupIcon group={m.value} className="h-4 w-4" />
          {m.label}
        </button>
      ))}
    </div>
  );
}
