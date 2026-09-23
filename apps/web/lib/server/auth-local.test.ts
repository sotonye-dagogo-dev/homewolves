import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  jwtSecret,
  signJwt,
  verifyJwt,
  issueTokens,
  encodeOtpCookie,
  decodeOtpCookie,
  generateOtp,
  generateReferralCode,
  isValidEmail,
  OTP_COOKIE,
} from './auth-local';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('jwtSecret', () => {
  it('uses the dev fallback when JWT_SECRET is unset outside production', () => {
    vi.stubEnv('JWT_SECRET', '');
    vi.stubEnv('NODE_ENV', 'test');
    expect(jwtSecret()).toBe('homewolves-dev-secret');
  });

  it('prefers JWT_SECRET when set', () => {
    vi.stubEnv('JWT_SECRET', 'prod-secret');
    expect(jwtSecret()).toBe('prod-secret');
  });

  it('throws in production when JWT_SECRET is missing', () => {
    vi.stubEnv('JWT_SECRET', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => jwtSecret()).toThrow(/JWT_SECRET/);
  });
});

describe('signJwt / verifyJwt', () => {
  it('round-trips a payload', () => {
    const token = signJwt({ sub: 'u-1', email: 'a@b.com', role: 'BUYER', typ: 'access' }, 60);
    const payload = verifyJwt(token);
    expect(payload).toMatchObject({ sub: 'u-1', email: 'a@b.com', role: 'BUYER', typ: 'access' });
  });

  it('rejects a tampered token', () => {
    const token = signJwt({ sub: 'u-1', email: 'a@b.com', role: 'BUYER' }, 60);
    const [h, b] = token.split('.');
    const forged = `${h}.${b}.AAAA`;
    expect(verifyJwt(forged)).toBeNull();
  });

  it('rejects garbage and empty tokens', () => {
    expect(verifyJwt('')).toBeNull();
    expect(verifyJwt('not-a-jwt')).toBeNull();
    expect(verifyJwt('a.b.c')).toBeNull();
  });

  it('rejects an expired token', () => {
    vi.useFakeTimers();
    const token = signJwt({ sub: 'u-1', email: 'a@b.com', role: 'BUYER' }, 1);
    vi.advanceTimersByTime(5000);
    expect(verifyJwt(token)).toBeNull();
    vi.useRealTimers();
  });
});

describe('issueTokens', () => {
  it('returns access/refresh tokens and a safe user object', () => {
    const result = issueTokens({
      id: 'u-1',
      email: 'a@b.com',
      role: 'BUYER',
      firstName: 'A',
      lastName: 'B',
      verified: true,
      avatar: null,
    });
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.user).toEqual({
      id: 'u-1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      role: 'BUYER',
      verified: true,
      avatar: undefined,
    });
    expect(verifyJwt(result.accessToken)).toMatchObject({ sub: 'u-1', typ: 'access' });
    expect(verifyJwt(result.refreshToken)).toMatchObject({ sub: 'u-1', typ: 'refresh' });
  });
});

describe('OTP cookie', () => {
  const state = {
    email: 'a@b.com',
    otp: '123456',
    exp: Date.now() + 60_000,
    purpose: 'register' as const,
  };

  it('round-trips a valid cookie', () => {
    const encoded = encodeOtpCookie(state);
    expect(encoded).toContain('.');
    const decoded = decodeOtpCookie(encoded);
    expect(decoded).toMatchObject(state);
  });

  it('rejects tampered, malformed, and expired cookies', () => {
    const encoded = encodeOtpCookie(state);
    expect(decodeOtpCookie(encoded.slice(0, -4) + 'XXXX')).toBeNull();
    expect(decodeOtpCookie('')).toBeNull();
    expect(decodeOtpCookie(null)).toBeNull();
    expect(decodeOtpCookie(undefined)).toBeNull();
    expect(decodeOtpCookie('payload-only')).toBeNull();

    const expired = encodeOtpCookie({ ...state, exp: Date.now() - 1 });
    expect(decodeOtpCookie(expired)).toBeNull();
  });

  it('uses the expected cookie name', () => {
    expect(OTP_COOKIE).toBe('hw_otp');
  });
});

describe('generateOtp', () => {
  it('produces a 6-digit code', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });
});

describe('generateReferralCode', () => {
  it('produces an 8-char alphanumeric code without ambiguous chars', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateReferralCode();
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    }
  });
});

describe('isValidEmail', () => {
  it('accepts normal emails', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
  });

  it('rejects non-emails', () => {
    expect(isValidEmail('nope')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@c.com')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(42)).toBe(false);
    expect(isValidEmail(`${'a'.repeat(250)}@b.com`)).toBe(false);
  });
});
