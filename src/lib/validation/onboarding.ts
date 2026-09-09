import { z } from "zod";
import {
  MODALITIES,
  TRAINING_GOALS,
  type Modality,
  type TrainingGoal,
} from "@/lib/constants/onboarding";

const modalityValues = MODALITIES.map((m) => m.value) as [
  Modality,
  ...Modality[],
];
const goalValues = TRAINING_GOALS.map((g) => g.value) as [
  TrainingGoal,
  ...TrainingGoal[],
];

export const onboardingSchema = z.object({
  modalities: z
    .array(z.enum(modalityValues))
    .min(1, "Choose at least one sport"),
  goals: z.array(z.enum(goalValues)).min(1, "Choose at least one goal"),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
