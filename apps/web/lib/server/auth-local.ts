/**
 * Server-side local auth helpers — used only when no external NestJS backend
 * is configured (backendOrigin() is null). Signs HS256 JWTs with node:crypto
 * and stores the pending OTP in an HMAC-signed HttpOnly cookie (serverless-safe,
 * no in-memory state).
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const DEV_JWT_SECRET = 'homewolves-dev-secret';

export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('JWT_SECRET must be set when NODE_ENV=production');
  }
  return secret || DEV_JWT_SECRET;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function hmac(input: string): string {
  return createHmac('sha256', jwtSecret()).update(input).digest('base64url');
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  typ?: 'access' | 'refresh';
}

export function signJwt(payload: JwtPayload, expiresInSeconds: number): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds }));
  const sig = createHmac('sha256', jwtSecret()).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts as [string, string, string];
    const expected = createHmac('sha256', jwtSecret()).update(`${header}.${body}`).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as JwtPayload & {
      exp?: number;
    };
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function issueTokens(user: { id: string; email: string; role: string; firstName?: string; lastName?: string; verified?: boolean; avatar?: string | null }) {
  const accessToken = signJwt({ sub: user.id, email: user.email, role: user.role, typ: 'access' }, 15 * 60);
  const refreshToken = signJwt({ sub: user.id, email: user.email, role: user.role, typ: 'refresh' }, 30 * 24 * 60 * 60);
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      role: user.role,
      verified: user.verified ?? false,
      avatar: user.avatar ?? undefined,
    },
  };
}

export interface OtpState {
  email: string;
  otp: string;
  exp: number;
  purpose: 'register' | 'login';
}

export const OTP_COOKIE = 'hw_otp';
const OTP_TTL_SECONDS = 10 * 60;

export function encodeOtpCookie(state: OtpState): string {
  const payload = b64url(JSON.stringify(state));
  return `${payload}.${hmac(payload)}`;
}

export function decodeOtpCookie(value: string | undefined | null): OtpState | null {
  if (!value) return null;
  try {
    const [payload, sig] = value.split('.');
    if (!payload || !sig) return null;
    const expected = hmac(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const state = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as OtpState;
    if (!state.email || !state.otp || !state.exp) return null;
    if (state.exp < Date.now()) return null;
    return state;
  } catch {
    return null;
  }
}

export function otpCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/api/v1/auth',
    maxAge: OTP_TTL_SECONDS,
  };
}

export function generateOtp(): string {
  return String(Number(randomBytes(3).readUIntBE(0, 3)) % 900000 + 100000);
}

/** Sends an OTP email via Resend when RESEND_API_KEY is set; no-ops otherwise. */
export async function sendOtpEmail(to: string, otp: string, firstName = 'there'): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? 'hello@mail.homewolves.com',
        to: [to],
        subject: `Your Homewolves verification code is ${otp}`,
        html: `<p>Hi ${firstName},</p><p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
      }),
    });
  } catch {
    // Email delivery must never break the auth flow.
  }
}

export function generateReferralCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 255;
}
