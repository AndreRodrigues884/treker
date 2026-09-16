import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import { getMuscleGroupsWithExercises } from "@/lib/gym/queries";
import { MUSCLE_GROUPS } from "@/lib/constants/gym";
import { AddMuscleGroupButton } from "@/components/gym/add-muscle-group-button";
import { MuscleGroupIcon } from "@/components/gym/muscle-group-icon";

export default async function GymPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile?.modalities.includes("gym")) redirect("/dashboard");

  const withExercises = await getMuscleGroupsWithExercises(user.id);
  const started = MUSCLE_GROUPS.filter((m) => withExercises.has(m.value));
  const remaining = MUSCLE_GROUPS.filter((m) => !withExercises.has(m.value));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gym</h1>
        <p className="text-zinc-400">
          {started.length > 0
            ? "Jump back into one of your workouts, or start a new one."
            : "Pick a muscle group to get started."}
        </p>
      </div>

      {started.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">
            Your workouts
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {started.map((m) => (
              <Link
                key={m.value}
                href={`/dashboard/gym/${m.value}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/40 px-4 py-6 text-center transition hover:border-slate-500"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.tint}`}
                >
                  <MuscleGroupIcon group={m.value} className="h-6 w-6" />
                </span>
                <span className="text-sm font-medium text-zinc-200">
                  {m.label}
                </span>
              </Link>
            ))}
            <AddMuscleGroupButton remaining={remaining} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MUSCLE_GROUPS.map((m) => (
            <Link
              key={m.value}
              href={`/dashboard/gym/${m.value}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/40 px-4 py-6 text-center transition hover:border-slate-500"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.tint}`}
              >
                <MuscleGroupIcon group={m.value} className="h-6 w-6" />
              </span>
              <span className="text-sm font-medium text-zinc-200">
                {m.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
