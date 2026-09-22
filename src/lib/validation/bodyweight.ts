import { z } from "zod";

// 20-300kg covers every plausible human bodyweight with headroom either
// side — wide enough to never block a real entry, tight enough to catch
// a fat-fingered typo (e.g. an extra digit) before it lands in the chart.
export const bodyweightLogSchema = z.object({
  weightKg: z.coerce.number().min(20).max(300),
});
export type BodyweightLogInput = z.infer<typeof bodyweightLogSchema>;
