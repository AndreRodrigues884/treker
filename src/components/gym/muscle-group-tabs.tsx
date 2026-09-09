import Link from "next/link";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/constants/gym";

/** Quick-switch row — only muscle groups that already have at least one
 * exercise (plus whichever one is active), so this doesn't just repeat
 * the full picker from /dashboard/gym. No hooks needed: the active value
 * is already known server-side from the route param. */
export function MuscleGroupTabs({
  active,
  available,
}: {
  active: MuscleGroup;
  available: Set<MuscleGroup>;
}) {
  const groups = MUSCLE_GROUPS.filter(
    (m) => available.has(m.value) || m.value === active,
  );

  if (groups.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {groups.map((m) => (
        <Link
          key={m.value}
          href={`/dashboard/gym/${m.value}`}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
            m.value === active
              ? "border-indigo-400 bg-indigo-500/10 text-indigo-300"
              : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
          }`}
        >
          <span>{m.icon}</span>
          {m.label}
        </Link>
      ))}
    </div>
  );
}
