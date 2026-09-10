import { z } from "zod";

export const signUpSchema = z.object({
  // Optional at signup — someone can skip it and add it later from
  // Settings, but once set it replaces their email in the dashboard
  // greeting.
  name: z
    .string()
    .trim()
    .max(80, "Keep it under 80 characters")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type SignInInput = z.infer<typeof signInSchema>;
