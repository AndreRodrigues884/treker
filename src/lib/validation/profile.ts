import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(80, "Keep it under 80 characters"),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/** Both fields optional/clearable (an empty field means "don't know
 * yet", not 0) — an empty string from the form is normalized to null
 * before the numeric check runs. */
const optionalMetric = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().min(min).max(max).nullable(),
  );

export const bodyMetricsSchema = z.object({
  bodyweightKg: optionalMetric(20, 400),
  heightCm: optionalMetric(50, 272),
});
export type BodyMetricsInput = z.infer<typeof bodyMetricsSchema>;

export const emailChangeSchema = z.object({
  newEmail: z.string().trim().email("Enter a valid email address"),
});
export type EmailChangeInput = z.infer<typeof emailChangeSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ["confirmPassword"],
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
