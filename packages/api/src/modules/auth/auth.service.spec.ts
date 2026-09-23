import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { ReferralsService } from '../referrals/referrals.service';
import { users, referrals } from '../../drizzle/schema';

type MockFn = ReturnType<typeof vi.fn>;

describe('AuthService', () => {
  let service: AuthService;
  let mocks: ReturnType<typeof createDrizzleMock>;
  let audit: { log: MockFn };
  let activityService: { awardForUser: MockFn };
  let referralsService: { ensureCodeForNewUser: MockFn };
  let jwtService: { sign: MockFn; verifyAsync: MockFn };

  const user = {
    id: 'u-1',
    email: 'a@b.com',
    role: 'BUYER',
    firstName: 'A',
    lastName: 'B',
    verified: true,
    avatar: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks = createDrizzleMock();
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    activityService = { awardForUser: vi.fn().mockResolvedValue(null) };
    referralsService = { ensureCodeForNewUser: vi.fn().mockResolvedValue('CODE1234') };
    jwtService = { sign: vi.fn().mockReturnValue('access-token'), verifyAsync: vi.fn() };
    service = new AuthService(
      mocks.db,
      jwtService as never,
      audit as unknown as AuditService,
      activityService as unknown as ActivityService,
      referralsService as unknown as ReferralsService,
      { send: vi.fn().mockResolvedValue({ status: 'simulated' }) } as never,
    );
  });

  describe('register', () => {
    it('throws ConflictException for a duplicate email', async () => {
      mocks.select.mockReturnValue(createChain([{ id: 'u-1' }]));
      await expect(service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' })).rejects.toThrow('Email already registered');
    });

    it('issues an OTP for a new email', async () => {
      mocks.select.mockReturnValue(createChain([]));
      const result = await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      expect(result.message).toBe('OTP sent');
      expect(result.otp).toMatch(/^\d{6}$/);
    });
  });

  describe('verifyOtp', () => {
    it('rejects an unknown email', async () => {
      await expect(service.verifyOtp({ email: 'x@y.com', otp: '123456' })).rejects.toThrow('OTP expired or not found');
    });

    it('rejects a wrong OTP', async () => {
      mocks.select.mockReturnValue(createChain([]));
      await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      await expect(service.verifyOtp({ email: 'a@b.com', otp: '000000' })).rejects.toThrow('Invalid OTP');
    });

    it('verifies a valid OTP and returns tokens', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([]))
        .mockReturnValue(createChain([user]));

      const reg = await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      const result = await service.verifyOtp({ email: 'a@b.com', otp: reg.otp! });

      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'OTP_VERIFIED' }));
      expect(activityService.awardForUser).toHaveBeenCalledWith('u-1', 'BUYER', 'daily_login', expect.anything());
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeTruthy();
    });

    it('auto-creates a user when none exists (register does not insert a row)', async () => {
      // register: email lookup → empty; verify: user lookup → empty; insert → created
      mocks.select
        .mockReturnValueOnce(createChain([])) // register duplicate check
        .mockReturnValue(createChain([])); // verify user lookup
      mocks.insert.mockReturnValueOnce(
        createChain([{ ...user, id: 'u-created', email: 'a@b.com' }]),
      );

      const reg = await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      const result = await service.verifyOtp({ email: 'a@b.com', otp: reg.otp! });

      expect(mocks.insert).toHaveBeenCalledWith(users);
      expect(result.accessToken).toBe('access-token');
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'OTP_VERIFIED' }));
    });

    it('does not leak the OTP in production register responses', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mocks.select.mockReturnValue(createChain([]));
      const result = await service.register({ email: 'prod@b.com' });
      expect(result.message).toBe('OTP sent');
      expect(result).not.toHaveProperty('otp');
      vi.unstubAllEnvs();
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      mocks.select.mockReturnValue(createChain([]));
      await expect(service.login({ email: 'x@y.com' })).rejects.toThrow('No account found with this email');
    });

    it('issues an OTP for an existing user', async () => {
      mocks.select.mockReturnValue(createChain([user]));
      const result = await service.login({ email: 'a@b.com' });
      expect(result.message).toBe('OTP sent');
      expect(result.otp).toMatch(/^\d{6}$/);
    });
  });

  describe('completeProfile', () => {
    it('updates an existing user with a chosen role', async () => {
      mocks.select.mockReturnValue(createChain([{ ...user, role: 'AGENT' }]));
      const setArgs: Array<Record<string, unknown>> = [];
      mocks.update.mockReturnValue(
        createChain([{ ...user, role: 'AGENT', firstName: 'Ada', lastName: 'Okon' }], (method, args) => {
          if (method === 'set') setArgs.push(args[0] as Record<string, unknown>);
        }),
      );

      const result = await service.completeProfile({
        email: 'a@b.com',
        firstName: 'Ada',
        lastName: 'Okon',
        phone: '0801',
        role: 'AGENT',
      });

      expect(mocks.update).toHaveBeenCalledWith(users);
      expect(setArgs[0]).toMatchObject({ role: 'AGENT' });
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'PROFILE_COMPLETED' }));
      expect(result.accessToken).toBe('access-token');
    });

    it('creates a new user, ensures a referral code, and applies an optional referral', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([]))
        .mockReturnValueOnce(createChain([{ id: 'agent-9', firstName: 'Agent', lastName: 'Nine', role: 'AGENT', referralCode: 'AGENT999' }]));

      const updateSet: Array<Record<string, unknown>> = [];
      mocks.update.mockReturnValue(
        createChain([], (method, args) => {
          if (method === 'set') updateSet.push(args[0] as Record<string, unknown>);
        }),
      );

      const insertValues: Array<Record<string, unknown>> = [];
      mocks.insert
        .mockReturnValueOnce(
          createChain([{ ...user, id: 'u-new', email: 'new@b.com', referralCode: 'CODE1234' }], (method, args) => {
            if (method === 'values') insertValues.push(args[0] as Record<string, unknown>);
          }),
        )
        .mockReturnValueOnce(
          createChain([{ id: 'r-1', code: 'AGENT999', referrerId: 'agent-9', referredId: 'u-new', status: 'active' }], (method, args) => {
            if (method === 'values') insertValues.push(args[0] as Record<string, unknown>);
          }),
        );

      const result = await service.completeProfile({
        email: 'new@b.com',
        firstName: 'New',
        lastName: 'User',
        phone: '0802',
        referralCode: 'agent999',
      });

      expect(mocks.insert).toHaveBeenNthCalledWith(1, users);
      expect(mocks.insert).toHaveBeenNthCalledWith(2, referrals);
      expect(insertValues[0]).toMatchObject({ referralCode: 'CODE1234' });
      expect(updateSet[0]).toEqual({ referredById: 'agent-9' });
      expect(insertValues[1]).toMatchObject({ code: 'AGENT999', referrerId: 'agent-9', referredId: 'u-new' });
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'PROFILE_COMPLETED' }));
      expect(result.accessToken).toBe('access-token');
    });

    it('rejects an invalid referral code', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([]))
        .mockReturnValue(createChain([]));
      mocks.insert.mockReturnValue(createChain([{ ...user, id: 'u-new', role: 'BUYER' }]));

      await expect(
        service.completeProfile({
          email: 'new@b.com',
          firstName: 'New',
          lastName: 'User',
          phone: '0802',
          referralCode: 'NOPE123',
        }),
      ).rejects.toThrow('Invalid referral code');
    });
  });

  describe('exchangeSupabaseToken', () => {
    const basePayload = {
      sub: 'sb-1',
      email: 'ada@b.com',
      user_metadata: { full_name: 'Ada Okon', avatar_url: 'https://x/a.png' },
    };

    it('rejects when SUPABASE_JWT_SECRET is not configured', async () => {
      vi.stubEnv('SUPABASE_JWT_SECRET', '');
      await expect(service.exchangeSupabaseToken({ accessToken: 'tok' })).rejects.toThrow('Supabase auth is not configured');
      vi.unstubAllEnvs();
    });

    it('rejects an invalid token', async () => {
      vi.stubEnv('SUPABASE_JWT_SECRET', 'secret');
      jwtService.verifyAsync.mockRejectedValueOnce(new Error('bad'));
      await expect(service.exchangeSupabaseToken({ accessToken: 'tok' })).rejects.toThrow('Invalid or expired Supabase session');
      vi.unstubAllEnvs();
    });

    it('rejects a session missing email', async () => {
      vi.stubEnv('SUPABASE_JWT_SECRET', 'secret');
      jwtService.verifyAsync.mockResolvedValueOnce({ sub: 'sb-1' });
      await expect(service.exchangeSupabaseToken({ accessToken: 'tok' })).rejects.toThrow('Supabase session is missing identity');
      vi.unstubAllEnvs();
    });

    it('creates a new user from Supabase metadata and returns tokens', async () => {
      vi.stubEnv('SUPABASE_JWT_SECRET', 'secret');
      jwtService.verifyAsync.mockResolvedValueOnce(basePayload);

      mocks.select
        .mockReturnValueOnce(createChain([])) // by providerId
        .mockReturnValueOnce(createChain([])); // by email

      const insertValues: Array<Record<string, unknown>> = [];
      mocks.insert.mockReturnValue(
        createChain([{ ...user, id: 'u-sb', email: 'ada@b.com', providerId: 'supabase:sb-1', referralCode: 'CODE1234' }], (method, args) => {
          if (method === 'values') insertValues.push(args[0] as Record<string, unknown>);
        }),
      );

      const result = await service.exchangeSupabaseToken({ accessToken: 'tok', referralCode: undefined });

      expect(insertValues[0]).toMatchObject({
        provider: 'supabase',
        providerId: 'supabase:sb-1',
        firstName: 'Ada',
        lastName: 'Okon',
        verified: true,
        referralCode: 'CODE1234',
      });
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'OAUTH_LOGIN' }));
      expect(activityService.awardForUser).toHaveBeenCalledWith('u-sb', 'BUYER', 'daily_login', expect.anything());
      expect(result.accessToken).toBe('access-token');
      vi.unstubAllEnvs();
    });

    it('returns tokens for an existing linked providerId user', async () => {
      vi.stubEnv('SUPABASE_JWT_SECRET', 'secret');
      jwtService.verifyAsync.mockResolvedValueOnce(basePayload);

      mocks.select.mockReturnValue(createChain([{ ...user, id: 'u-sb', providerId: 'supabase:sb-1' }]));

      const result = await service.exchangeSupabaseToken({ accessToken: 'tok' });
      expect(result.accessToken).toBe('access-token');
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'OAUTH_LOGIN' }));
      vi.unstubAllEnvs();
    });

    it('links an existing email account to the Supabase identity', async () => {
      vi.stubEnv('SUPABASE_JWT_SECRET', 'secret');
      jwtService.verifyAsync.mockResolvedValueOnce(basePayload);

      mocks.select
        .mockReturnValueOnce(createChain([])) // by providerId
        .mockReturnValueOnce(createChain([{ ...user, id: 'u-existing' }]));

      const updateSet: Array<Record<string, unknown>> = [];
      mocks.update.mockReturnValue(
        createChain([{ ...user, id: 'u-existing', providerId: 'supabase:sb-1' }], (method, args) => {
          if (method === 'set') updateSet.push(args[0] as Record<string, unknown>);
        }),
      );

      const result = await service.exchangeSupabaseToken({ accessToken: 'tok' });
      expect(updateSet[0]).toMatchObject({ provider: 'supabase', providerId: 'supabase:sb-1', verified: true });
      expect(result.accessToken).toBe('access-token');
      vi.unstubAllEnvs();
    });
  });

  describe('refreshToken / logout', () => {
    it('throws for an unknown refresh token', async () => {
      await expect(service.refreshToken('not-a-token')).rejects.toThrow('Invalid or expired refresh token');
    });

    it('rotates a valid refresh token', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([]))
        .mockReturnValue(createChain([user]));

      const reg = await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      const verified = await service.verifyOtp({ email: 'a@b.com', otp: reg.otp! });

      const rotated = await service.refreshToken(verified.refreshToken);

      expect(rotated.accessToken).toBe('access-token');
      expect(rotated.refreshToken).toBeTruthy();
      expect(rotated.refreshToken).not.toBe(verified.refreshToken);
    });

    it('logs out by revoking the users refresh tokens', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([]))
        .mockReturnValue(createChain([user]));

      const reg = await service.register({ email: 'a@b.com', phone: '123', firstName: 'A', lastName: 'B' });
      const verified = await service.verifyOtp({ email: 'a@b.com', otp: reg.otp! });

      await service.logout('u-1');
      await expect(service.refreshToken(verified.refreshToken)).rejects.toThrow('Invalid or expired refresh token');
    });
  });
});
