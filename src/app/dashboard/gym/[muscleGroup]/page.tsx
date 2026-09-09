import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import {
  getExercises,
  getExerciseSets,
  getMuscleGroupsWithExercises,
} from "@/lib/gym/queries";
import { progressHistory, setsForDate, todayISO } from "@/lib/gym/derive";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/constants/gym";
import { MuscleGroupTabs } from "@/components/gym/muscle-group-tabs";
import { AddExercisePanel } from "@/components/gym/add-exercise-panel";
import { ExerciseCard } from "@/components/gym/exercise-card";
import { ProgressChart } from "@/components/gym/progress-chart";
import { WorkoutSessionProvider } from "@/components/gym/session-context";
import { SaveSessionButton } from "@/components/gym/save-session-button";
import { SessionProgress } from "@/components/gym/session-progress";

export function generateStaticParams() {
  return MUSCLE_GROUPS.map((m) => ({ muscleGroup: m.value }));
}

export default async function MuscleGroupPage({
  params,
}: {
  params: Promise<{ muscleGroup: string }>;
}) {
  const { muscleGroup } = await params;
  const entry = MUSCLE_GROUPS.find((m) => m.value === muscleGroup);
  if (!entry) notFound();
  const group = muscleGroup as MuscleGroup;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile?.modalities.includes("gym")) redirect("/dashboard");

  const [exercises, available] = await Promise.all([
    getExercises(user.id, group),
    getMuscleGroupsWithExercises(user.id),
  ]);

  const exercisesWithSets = await Promise.all(
    exercises.map(async (exercise) => ({
      exercise,
      sets: await getExerciseSets(exercise.id),
    })),
  );

  const today = todayISO();
  const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
  const todaySetKeys = exercisesWithSets.flatMap(({ exercise, sets }) =>
    setsForDate(sets, today).map((s) => `${exercise.id}:${s.set_number}`),
  );

  return (
    <WorkoutSessionProvider>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-500">
              <Link href="/dashboard" className="hover:text-zinc-300">
                Dashboard
              </Link>{" "}
              /{" "}
              <Link href="/dashboard/gym" className="hover:text-zinc-300">
                Gym
              </Link>
            </p>
            <h1 className="text-2xl font-bold">{entry.label}</h1>
            <SessionProgress todaySetKeys={todaySetKeys} totalSets={totalSets} />
          </div>
          <SaveSessionButton muscleGroup={group} />
        </div>

        <MuscleGroupTabs active={group} available={available} />

        {exercisesWithSets.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-200">Progress</h2>
            {exercisesWithSets.map(({ exercise, sets }) => (
              <div
                key={exercise.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
              >
                <p className="mb-2 text-sm font-semibold text-zinc-300">
                  {exercise.tracks_load ? "Volume" : "Reps"} — {exercise.name}
                </p>
                <ProgressChart
                  points={progressHistory(sets, exercise.tracks_load)}
                  unit={exercise.tracks_load ? "kg" : ""}
                />
              </div>
            ))}
          </div>
        )}

        <AddExercisePanel muscleGroup={group} />

        <div className="space-y-4">
          {exercisesWithSets.map(({ exercise, sets }) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              sets={sets}
              muscleGroup={group}
            />
          ))}
          {exercises.length === 0 && (
            <p className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
              No exercises yet for {entry.label}. Add your first one above.
            </p>
          )}
        </div>
      </div>
    </WorkoutSessionProvider>
  );
}
