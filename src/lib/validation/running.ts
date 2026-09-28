import { z } from "zod";

// Up to 500km catches a fat-fingered typo (extra digit) without
// blocking anything a real run could plausibly be.
export const runSchema = z
  .object({
    distanceKm: z.coerce.number().min(0.01).max(500),
    hours: z.coerce.number().int().min(0).max(23),
    minutes: z.coerce.number().int().min(0).max(59),
    seconds: z.coerce.number().int().min(0).max(59),
  })
  .refine((data) => data.hours > 0 || data.minutes > 0 || data.seconds > 0, {
    message: "Enter a duration",
    path: ["minutes"],
  });
export type RunInput = z.infer<typeof runSchema>;
