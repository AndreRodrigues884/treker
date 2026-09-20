import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/supabase/queries";
import {
  getExercises,
  getExerciseSetsForExercises,
  getMuscleGroupsWithExercises,
  getRoutines,
} from "@/lib/gym/queries";
import { routineProgressHistory, routineUnit } from "@/lib/gym/derive";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/constants/gym";
import type { Exercise, Routine } from "@/types/gym";
import { MuscleGroupTabs } from "@/components/gym/muscle-group-tabs";
import { AddExercisePanel } from "@/components/gym/add-exercise-panel";
import { SortableExerciseList } from "@/components/gym/sortable-exercise-list";
import { ProgressChart } from "@/components/gym/progress-chart";
import { RoutineHeading } from "@/components/gym/routine-heading";
import { WorkoutSessionProvider } from "@/components/gym/session-context";
import { SaveSessionButton } from "@/components/gym/save-session-button";
import { SessionProgress } from "@/components/gym/session-progress";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ArrowLeftIcon } from "@/components/ui/icons";

export function generateStaticParams() {
  return MUSCLE_GROUPS.map((m) => ({ muscleGroup: m.value }));
}

const UNIT_LABEL = {
  kg: "Volume",
  reps: "Reps",
  secs: "Duration",
  "": "Activity",
} as const;

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

  // Routines + exercises are cheap (no sets involved) and drive the
  // header/tabs/add-exercise picker, so they're worth awaiting up front.
  // The heavier part — every logged set, grouped and charted per routine
  // — is deferred into its own Suspense boundary below.
  const [routines, exercises, available] = await Promise.all([
    getRoutines(user.id, group),
    getExercises(user.id, group),
    getMuscleGroupsWithExercises(user.id),
  ]);

  const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
  const routineList = routines.map((r) => ({ id: r.id, name: r.name }));

  return (
    <WorkoutSessionProvider
      userId={user.id}
      scopeKey={group}
      validExerciseIds={exercises.map((e) => e.id)}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              href="/dashboard/gym"
              aria-label="Back to muscle groups"
              className="mt-1 shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-slate-800 hover:text-zinc-200"
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

        <AddExercisePanel muscleGroup={group} routines={routineList} />

        {routines.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-zinc-500">
            No workouts yet for {entry.label}. Add your first exercise above
            to start one.
          </p>
        )}

        <Suspense
          fallback={<SectionSpinner label="Loading your exercises…" className="h-40" />}
        >
          <RoutineCharts
            group={group}
            routines={routines}
            exercises={exercises}
            routineList={routineList}
          />
        </Suspense>
      </div>
    </WorkoutSessionProvider>
  );
}

async function RoutineCharts({
  group,
  routines,
  exercises,
  routineList,
}: {
  group: MuscleGroup;
  routines: Routine[];
  exercises: Exercise[];
  routineList: { id: string; name: string }[];
}) {
  // One query for every exercise's sets, not one query per exercise —
  // that N+1 pattern was the actual cause of muscle groups feeling slow
  // to switch between.
  const allSets = await getExerciseSetsForExercises(exercises.map((e) => e.id));
  const setsByExercise = new Map<string, typeof allSets>();
  for (const s of allSets) {
    const list = setsByExercise.get(s.exercise_id) ?? [];
    list.push(s);
    setsByExercise.set(s.exercise_id, list);
  }
  const exercisesWithSets = exercises.map((exercise) => ({
    exercise,
    sets: setsByExercise.get(exercise.id) ?? [],
  }));

  const byRoutine = new Map<string, typeof exercisesWithSets>();
  for (const item of exercisesWithSets) {
    const list = byRoutine.get(item.exercise.routine_id) ?? [];
    list.push(item);
    byRoutine.set(item.exercise.routine_id, list);
  }

  return (
    <>
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

            <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
              <p className="text-sm font-semibold text-zinc-100">
                {UNIT_LABEL[unit]} — {routine.name}
              </p>
              <p className="mb-2 text-xs text-zinc-500">
                {UNIT_LABEL[unit]} per session · {points.length}{" "}
                {points.length === 1 ? "session" : "sessions"}
              </p>
              <ProgressChart
                points={points}
                unit={unit === "kg" ? "kg" : unit === "secs" ? "s" : ""}
              />
            </div>

            <SortableExerciseList
              routineId={routine.id}
              muscleGroup={group}
              items={items}
              routines={routineList}
            />
          </div>
        );
      })}
    </>
  );
}
