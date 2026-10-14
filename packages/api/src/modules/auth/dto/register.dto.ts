import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().trim().email().max(255),
    phone: z.string().trim().max(20).optional(),
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    referralCode: z.string().trim().max(20).optional(),
    role: z.enum(['BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER']).optional(),
  })
  .strict();
export type RegisterDto = z.infer<typeof registerSchema>;

export const verifyOtpSchema = z
  .object({
    email: z.string().trim().email().max(255),
    otp: z.string().trim().min(6).max(6),
  })
  .strict();
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;

export const loginSchema = z
  .object({
    email: z.string().trim().email().max(255),
  })
  .strict();
export type LoginDto = z.infer<typeof loginSchema>;

export const completeProfileSchema = z
  .object({
    email: z.string().trim().email().max(255),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(7).max(20),
    role: z.enum(['BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER']).optional(),
    referralCode: z.string().trim().max(20).optional(),
  })
  .strict();
export type CompleteProfileDto = z.infer<typeof completeProfileSchema>;

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().trim().min(1).max(128),
  })
  .strict();
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export const supabaseLoginSchema = z
  .object({
    accessToken: z.string().trim().min(1),
    referralCode: z.string().trim().max(20).optional(),
    role: z.enum(['BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER']).optional(),
  })
  .strict();
export type SupabaseLoginDto = z.infer<typeof supabaseLoginSchema>;

export const googleLoginSchema = z
  .object({
    credential: z.string().trim().min(10),
    referralCode: z.string().trim().max(20).optional(),
    role: z.enum(['BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER']).optional(),
  })
  .strict();
export type GoogleLoginDto = z.infer<typeof googleLoginSchema>;

// ─── Password auth (parity with web local-auth fallback) ─────────────
// Additive, non-breaking: new routes only; existing OTP/OAuth flows untouched.
const passwordField = z.string().min(8).max(128);

export const registerPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: passwordField,
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(20).optional(),
    role: z.enum(['BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER']).optional(),
    referralCode: z.string().trim().max(20).optional(),
  })
  .strict();
export type RegisterPasswordDto = z.infer<typeof registerPasswordSchema>;

export const loginPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(1).max(128),
  })
  .strict();
export type LoginPasswordDto = z.infer<typeof loginPasswordSchema>;

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
  })
  .strict();
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1),
    password: passwordField,
  })
  .strict();
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
