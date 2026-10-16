import { z } from "zod";
import {
  MUSCLE_GROUPS,
  EXECUTION_TYPES,
  DIFFICULTIES,
  EXERCISE_UNITS,
  NEW_ROUTINE,
  type MuscleGroup,
  type ExecutionType,
  type SetDifficulty,
  type ExerciseUnit,
} from "@/lib/constants/gym";

const muscleGroupValues = MUSCLE_GROUPS.map((m) => m.value) as [
  MuscleGroup,
  ...MuscleGroup[],
];
const executionTypeValues = EXECUTION_TYPES.map((e) => e.value) as [
  ExecutionType,
  ...ExecutionType[],
];
const difficultyValues = DIFFICULTIES.map((d) => d.value) as [
  SetDifficulty,
  ...SetDifficulty[],
];
const exerciseUnitValues = EXERCISE_UNITS.map((u) => u.value) as [
  ExerciseUnit,
  ...ExerciseUnit[],
];

export const exerciseSchema = z
  .object({
    muscleGroup: z.enum(muscleGroupValues),
    routineId: z.string().min(1, "Choose a workout"),
    newRoutineName: z.string().trim().max(60).optional(),
    name: z.string().trim().min(1, "Name is required").max(80),
    sets: z.coerce.number().int().min(1, "At least 1 set").max(20),
    unit: z.enum(exerciseUnitValues),
    // Reps top out at 100, seconds at 600 (10min) — checked below, since
    // the right ceiling depends on which unit this is.
    reps: z.coerce.number().int().min(1, "Enter a target").max(600),
    tracksLoad: z.coerce.boolean(),
    track1rm: z.coerce.boolean(),
    addsBodyweight: z.coerce.boolean(),
  })
  .refine((data) => data.unit !== "reps" || data.reps <= 100, {
    message: "At most 100 reps",
    path: ["reps"],
  })
  .refine(
    (data) => data.routineId !== NEW_ROUTINE || !!data.newRoutineName?.length,
    { message: "Enter a name for the new workout", path: ["newRoutineName"] },
  );
export type ExerciseInput = z.infer<typeof exerciseSchema>;

export const setLogSchema = z.object({
  exerciseId: z.string().uuid(),
  setNumber: z.coerce.number().int().min(1),
  weightKg: z.number().min(0).max(1000).nullable(),
  // Shared ceiling with the exercise's own target — a held set can run
  // longer than a rep count would (600s = 10min).
  reps: z.coerce.number().int().min(0).max(600),
  executionType: z.enum(executionTypeValues),
  difficulty: z.enum(difficultyValues),
});
export type SetLogInput = z.infer<typeof setLogSchema>;
