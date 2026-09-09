import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { getMuscleGroupsWithExercises } from "@/lib/gym/queries";
import { MUSCLE_GROUPS } from "@/lib/constants/gym";

export default async function GymPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile?.modalities.includes("gym")) redirect("/dashboard");

  const withExercises = await getMuscleGroupsWithExercises(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gym</h1>
        <p className="text-zinc-400">
          Pick a muscle group to see or log exercises.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MUSCLE_GROUPS.map((m) => (
          <Link
            key={m.value}
            href={`/dashboard/gym/${m.value}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center transition hover:border-zinc-600"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${m.tint}`}
            >
              {m.icon}
            </span>
            <span className="text-sm font-medium text-zinc-200">
              {m.label}
            </span>
            {withExercises.has(m.value) && (
              <span className="text-xs text-zinc-500">In progress</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
