import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import {
  getExercises,
  getExerciseSets,
  getMuscleGroupsWithExercises,
  getRoutines,
} from "@/lib/gym/queries";
import { routineProgressHistory, routineUnit } from "@/lib/gym/derive";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/constants/gym";
import { MuscleGroupTabs } from "@/components/gym/muscle-group-tabs";
import { AddExercisePanel } from "@/components/gym/add-exercise-panel";
import { SortableExerciseList } from "@/components/gym/sortable-exercise-list";
import { ProgressChart } from "@/components/gym/progress-chart";
import { RoutineHeading } from "@/components/gym/routine-heading";
import { WorkoutSessionProvider } from "@/components/gym/session-context";
import { SaveSessionButton } from "@/components/gym/save-session-button";
import { SessionProgress } from "@/components/gym/session-progress";
import { ArrowLeftIcon } from "@/components/ui/icons";

export function generateStaticParams() {
  return MUSCLE_GROUPS.map((m) => ({ muscleGroup: m.value }));
}

const UNIT_LABEL = { kg: "Volume", reps: "Reps", "": "Activity" } as const;

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

  const [routines, exercises, available] = await Promise.all([
    getRoutines(user.id, group),
    getExercises(user.id, group),
    getMuscleGroupsWithExercises(user.id),
  ]);

  const exercisesWithSets = await Promise.all(
    exercises.map(async (exercise) => ({
      exercise,
      sets: await getExerciseSets(exercise.id),
    })),
  );

  const byRoutine = new Map<string, typeof exercisesWithSets>();
  for (const item of exercisesWithSets) {
    const list = byRoutine.get(item.exercise.routine_id) ?? [];
    list.push(item);
    byRoutine.set(item.exercise.routine_id, list);
  }

  const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);

  return (
    <WorkoutSessionProvider>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link
              href="/dashboard/gym"
              aria-label="Back to muscle groups"
              className="mt-1 shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
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
              <SessionProgress totalSets={totalSets} />
            </div>
          </div>
          <SaveSessionButton muscleGroup={group} />
        </div>

        <MuscleGroupTabs active={group} available={available} />

        <AddExercisePanel
          muscleGroup={group}
          routines={routines.map((r) => ({ id: r.id, name: r.name }))}
        />

        {routines.length === 0 && (
          <p className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
            No workouts yet for {entry.label}. Add your first exercise above
            to start one.
          </p>
        )}

        {routines.map((routine) => {
          const items = byRoutine.get(routine.id) ?? [];
          const routineExercises = items.map((i) => i.exercise);
          const routineSets = items.flatMap((i) => i.sets);
          const unit = routineUnit(routineExercises);
          const points = routineProgressHistory(routineExercises, routineSets);

          return (
            <div key={routine.id} className="space-y-3">
              <RoutineHeading
                routineId={routine.id}
                muscleGroup={group}
                name={routine.name}
              />

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-sm font-semibold text-zinc-100">
                  {UNIT_LABEL[unit]} — {routine.name}
                </p>
                <p className="mb-2 text-xs text-zinc-500">
                  {UNIT_LABEL[unit]} per session · {points.length}{" "}
                  {points.length === 1 ? "session" : "sessions"}
                </p>
                <ProgressChart points={points} unit={unit === "kg" ? "kg" : ""} />
              </div>

              <SortableExerciseList
                routineId={routine.id}
                muscleGroup={group}
                items={items}
                routines={routines.map((r) => ({ id: r.id, name: r.name }))}
              />
            </div>
          );
        })}
      </div>
    </WorkoutSessionProvider>
  );
}
