import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must include at least one letter")
  .regex(/[0-9]/, "Password must include at least one number");

export const emailSchema = z.string().email("Enter a valid email address");

export const TAMU_EMAIL_ERROR =
  "Only @tamu.edu email addresses can create an account";

export const SIGNUP_EMAIL_ALLOWLIST = ["twbdavis@gmail.com"];

export function isAllowedSignupEmail(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.endsWith("@tamu.edu") ||
    SIGNUP_EMAIL_ALLOWLIST.includes(normalized)
  );
}

export const tamuEmailSchema = emailSchema.refine(isAllowedSignupEmail, {
  message: TAMU_EMAIL_ERROR,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: tamuEmailSchema,
  password: passwordSchema,
});
export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
