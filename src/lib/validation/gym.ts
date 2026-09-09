import { z } from "zod";
import {
  MUSCLE_GROUPS,
  EXECUTION_TYPES,
  DIFFICULTIES,
  NEW_ROUTINE,
  type MuscleGroup,
  type ExecutionType,
  type SetDifficulty,
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

export const exerciseSchema = z
  .object({
    muscleGroup: z.enum(muscleGroupValues),
    routineId: z.string().min(1, "Choose a workout"),
    newRoutineName: z.string().trim().max(60).optional(),
    name: z.string().trim().min(1, "Name is required").max(80),
    sets: z.coerce.number().int().min(1, "At least 1 set").max(20),
    reps: z.coerce.number().int().min(1, "At least 1 rep").max(100),
    tracksLoad: z.coerce.boolean(),
    track1rm: z.coerce.boolean(),
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
  reps: z.coerce.number().int().min(0).max(200),
  executionType: z.enum(executionTypeValues),
  difficulty: z.enum(difficultyValues),
});
export type SetLogInput = z.infer<typeof setLogSchema>;
