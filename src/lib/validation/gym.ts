import { z } from "zod";
import {
  MUSCLE_GROUPS,
  EXECUTION_TYPES,
  DIFFICULTIES,
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

export const exerciseSchema = z.object({
  muscleGroup: z.enum(muscleGroupValues),
  name: z.string().trim().min(1, "Name is required").max(80),
  sets: z.coerce.number().int().min(1, "At least 1 set").max(20),
  reps: z.coerce.number().int().min(1, "At least 1 rep").max(100),
  tracksLoad: z.coerce.boolean(),
});
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
