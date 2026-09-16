import { z } from "zod";
import { SWIM_STROKES, SWIM_DISTANCES, type SwimStroke } from "@/lib/constants/swimming";

const swimStrokeValues = SWIM_STROKES.map((s) => s.value) as [
  SwimStroke,
  ...SwimStroke[],
];

export const swimTimeSchema = z
  .object({
    stroke: z.enum(swimStrokeValues),
    distanceM: z.coerce
      .number()
      .refine((v) => (SWIM_DISTANCES as readonly number[]).includes(v), {
        message: "Choose a valid distance",
      }),
    minutes: z.coerce.number().int().min(0).max(59),
    // Hundredths precision (e.g. 23.45s) — how swim times are actually
    // read on a pool clock/touchpad.
    seconds: z.coerce.number().min(0).max(59.99),
  })
  .refine((data) => data.minutes > 0 || data.seconds > 0, {
    message: "Enter a time",
    path: ["seconds"],
  });
export type SwimTimeInput = z.infer<typeof swimTimeSchema>;
