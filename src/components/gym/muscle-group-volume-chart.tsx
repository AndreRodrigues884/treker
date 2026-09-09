import { MUSCLE_GROUPS } from "@/lib/constants/gym";
import type { MuscleGroupVolume } from "@/lib/gym/derive";

/** Horizontal bars — 7 categories with longish labels read better this
 * way than as columns. Each bar keeps its muscle group's own established
 * color (identity, not a generic categorical ramp) so it matches the
 * icon badges used for the same groups everywhere else. */
export function MuscleGroupVolumeChart({ data }: { data: MuscleGroupVolume[] }) {
  const max = Math.max(...data.map((d) => d.setsCount), 1);

  return (
    <div className="space-y-2.5">
      {data.map((d) => {
        const entry = MUSCLE_GROUPS.find((m) => m.value === d.muscleGroup);
        if (!entry) return null;
        const pct = (d.setsCount / max) * 100;
        return (
          <div key={d.muscleGroup} className="flex items-center gap-3">
            <span className="flex w-28 shrink-0 items-center gap-1.5 text-sm text-zinc-400">
              <span aria-hidden>{entry.icon}</span>
              {entry.label}
            </span>
            <div className="h-2 flex-1 rounded-full bg-zinc-800">
              <div
                className={`h-2 rounded-full ${entry.barTint}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-sm tabular-nums text-zinc-300">
              {d.setsCount}
            </span>
          </div>
        );
      })}
    </div>
  );
}
