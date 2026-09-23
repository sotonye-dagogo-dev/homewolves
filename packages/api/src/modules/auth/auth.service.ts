import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { UserRole, users, referrals } from '../../drizzle/schema';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { ReferralsService } from '../referrals/referrals.service';
import { EmailService } from '../email/email.service';
import { RegisterDto, VerifyOtpDto, LoginDto, CompleteProfileDto } from './dto/register.dto';
import * as crypto from 'crypto';

export type UserRow = typeof users.$inferSelect;

@Injectable()
export class AuthService {
  private otpStore = new Map<string, { code: string; expiresAt: number }>();
  private refreshStore = new Map<string, { userId: string; expiresAt: number }>();

  constructor(
    private db: DrizzleService,
    private jwtService: JwtService,
    private audit: AuditService,
    private activityService: ActivityService,
    private referralsService: ReferralsService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const [existing] = await this.db.select().from(users).where(eq(users.email, dto.email));
    if (existing) throw new ConflictException('Email already registered');

    const otp = this.generateOtp();
    this.otpStore.set(dto.email, { code: otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    void this.emailService.send(dto.email, 'otp_code', {
      firstName: dto.firstName ?? 'there',
      otp,
      expiresInMinutes: 10,
    });

    // Never expose the OTP in production responses (email-only delivery).
    return process.env.NODE_ENV === 'production' ? { message: 'OTP sent' } : { message: 'OTP sent', otp };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const stored = this.otpStore.get(dto.email);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('OTP expired or not found');
    }
    if (stored.code !== dto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }
    this.otpStore.delete(dto.email);

    const [user] = await this.db.select().from(users).where(eq(users.email, dto.email));
    if (!user) {
      // Register() intentionally does not create a user row (email uniqueness
      // is checked there). Auto-create a minimal verified-email shell so the
      // OTP-verified flow can complete; completeProfile fills in the rest.
      const role = UserRole.BUYER;
      const referralCode = await this.referralsService.ensureCodeForNewUser();
      const [created] = await this.db
        .insert(users)
        .values({
          email: dto.email,
          firstName: 'New',
          lastName: 'User',
          role,
          referralCode,
        })
        .returning();
      if (!created) throw new UnauthorizedException('User not found. Please register first.');
      return this.finishOtpVerification(created);
    }
    return this.finishOtpVerification(user);
  }

  private async finishOtpVerification(user: UserRow) {
    await this.audit.log({
      entityType: 'User',
      entityId: user.id,
      action: 'OTP_VERIFIED',
      actor: { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` },
    });

    this.activityService
      .awardForUser(user.id, user.role, 'daily_login', { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` })
      .catch(() => {});

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const [user] = await this.db.select().from(users).where(eq(users.email, dto.email));
    if (!user) throw new UnauthorizedException('No account found with this email');

    const otp = this.generateOtp();
    this.otpStore.set(dto.email, { code: otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    void this.emailService.send(dto.email, 'otp_code', {
      firstName: user.firstName,
      otp,
      expiresInMinutes: 10,
    });

    return process.env.NODE_ENV === 'production' ? { message: 'OTP sent' } : { message: 'OTP sent', otp };
  }

  async completeProfile(dto: CompleteProfileDto) {
    let user: UserRow | undefined | null = (await this.db.select().from(users).where(eq(users.email, dto.email)))[0] ?? null;

    const role = (dto.role ?? UserRole.BUYER) as (typeof users.$inferInsert)['role'];

    if (user) {
      [user] = await this.db
        .update(users)
        .set({
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role,
        })
        .where(eq(users.id, user.id))
        .returning();
    } else {
      const referralCode = await this.referralsService.ensureCodeForNewUser();
      [user] = await this.db
        .insert(users)
        .values({
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role,
          referralCode,
        })
        .returning();

      if (dto.referralCode) {
        await this.applyReferralOnSignup(user!, dto.referralCode);
      }
    }

    if (!user) throw new Error('Failed to create user');

    void this.emailService.send(user.email, 'welcome', {
      firstName: user.firstName,
      siteUrl: process.env.WEB_URL ?? 'https://homewolves.africa',
    });

    await this.audit.log({
      entityType: 'User',
      entityId: user.id,
      action: 'PROFILE_COMPLETED',
      actor: { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` },
    });

    return this.generateTokens(user);
  }

  private async applyReferralOnSignup(user: UserRow, code: string) {
    const [referrer] = await this.db.select().from(users).where(eq(users.referralCode, code.trim().toUpperCase()));
    if (!referrer || referrer.id === user.id) {
      throw new BadRequestException('Invalid referral code');
    }

    await this.db.update(users).set({ referredById: referrer.id }).where(eq(users.id, user.id));

    const [referral] = await this.db
      .insert(referrals)
      .values({
        code: code.trim().toUpperCase(),
        referrerId: referrer.id,
        referredId: user.id,
        status: 'active',
      })
      .returning();
    if (!referral) throw new Error('Failed to create referral');

    await this.audit.log({
      entityType: 'Referral',
      entityId: referral.id,
      action: 'REFERRAL_APPLIED',
      actor: { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` },
      metadata: { referrerId: referrer.id, code: code.trim().toUpperCase() },
    });

    if (referrer.email) {
      void this.emailService.send(referrer.email, 'referral_signup', {
        firstName: referrer.firstName ?? 'there',
        referredName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
        referralCode: code.trim().toUpperCase(),
      });
    }
  }

  async refreshToken(refreshToken: string) {
    const stored = this.refreshStore.get(refreshToken);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const [user] = await this.db.select().from(users).where(eq(users.id, stored.userId));
    if (!user) throw new UnauthorizedException('User not found');

    this.refreshStore.delete(refreshToken);
    return this.generateTokens(user);
  }

  async logout(userId: string) {
    for (const [token, data] of this.refreshStore.entries()) {
      if (data.userId === userId) this.refreshStore.delete(token);
    }
  }

  /**
   * Exchanges a Supabase Auth access token (from Google OAuth via Supabase
   * GoTrue) for Homewolves JWT tokens. The token is verified against
   * `SUPABASE_JWT_SECRET`; the user is found or created by `providerId`.
   */
  async exchangeSupabaseToken(dto: { accessToken: string; referralCode?: string; role?: string }) {
    if (!process.env.SUPABASE_JWT_SECRET) {
      throw new UnauthorizedException('Supabase auth is not configured');
    }

    let payload: Record<string, unknown>;
    try {
      payload = await this.jwtService.verifyAsync(dto.accessToken, {
        secret: process.env.SUPABASE_JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired Supabase session');
    }

    const sub = payload.sub as string | undefined;
    const email = payload.email as string | undefined;
    const metadata = (payload.user_metadata ?? payload.app_metadata ?? {}) as Record<string, unknown>;
    if (typeof sub !== 'string' || typeof email !== 'string') {
      throw new UnauthorizedException('Supabase session is missing identity');
    }
    const verifiedSub: string = sub;
    const verifiedEmail: string = email;

    const providerId = `supabase:${verifiedSub}`;

    let user: UserRow | null | undefined = (
      await this.db.select().from(users).where(eq(users.providerId, providerId))
    )[0];

    if (!user) {
      // Link an existing email account, otherwise create a new one.
      [user] = await this.db.select().from(users).where(eq(users.email, verifiedEmail));
      if (user) {
        [user] = await this.db
          .update(users)
          .set({ provider: 'supabase', providerId, verified: true, avatar: user.avatar ?? (metadata.avatar_url as string | undefined) ?? null })
          .where(eq(users.id, user.id))
          .returning();
      } else {
        const fullName = (metadata.full_name as string) ?? (metadata.name as string) ?? verifiedEmail;
        const [firstName, ...rest] = fullName.trim().split(/\s+/);
        const lastName = rest.join(' ') || '—';
        const role = (dto.role ?? 'BUYER') as (typeof users.$inferInsert)['role'];
        const referralCode = await this.referralsService.ensureCodeForNewUser();
        const insertValues: typeof users.$inferInsert = {
          email: verifiedEmail,
          firstName: firstName ?? 'User',
          lastName,
          role,
          verified: true,
          provider: 'supabase',
          providerId,
          avatar: metadata.avatar_url as string | undefined,
          referralCode,
        };
        [user] = await this.db
          .insert(users)
          .values(insertValues)
          .returning();

        if (dto.referralCode) {
          await this.applyReferralOnSignup(user!, dto.referralCode);
        }
      }
    }

    if (!user) throw new Error('Failed to resolve Supabase user');

    await this.audit.log({
      entityType: 'User',
      entityId: user.id,
      action: 'OAUTH_LOGIN',
      actor: { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` },
      metadata: { provider: 'supabase', subject: sub },
    });

    this.activityService
      .awardForUser(user.id, user.role, 'daily_login', { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` })
      .catch(() => {});

    return this.generateTokens(user);
  }

  /**
   * Direct Google OAuth — verifies a Google ID token (credential from
   * Google Identity Services) via tokeninfo endpoint, then creates or links
   * the Homewolves user. This is the preferred OAuth path; Supabase is kept
   * only as legacy fallback.
   */
  async exchangeGoogleToken(dto: { credential: string; referralCode?: string; role?: string }) {
    let info: {
      email?: string;
      sub?: string;
      email_verified?: string;
      aud?: string;
      name?: string;
      picture?: string;
      given_name?: string;
      family_name?: string;
    };
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(dto.credential)}`);
      if (!res.ok) throw new Error(`tokeninfo ${res.status}`);
      info = (await res.json()) as typeof info;
    } catch {
      throw new UnauthorizedException('Invalid Google credential');
    }
    const email = info.email;
    const sub = info.sub;
    if (!email || !sub || info.email_verified !== 'true') {
      throw new UnauthorizedException('Google token missing verified email');
    }
    // Optional: verify audience matches configured client id (server-only var)
    const expectedAud = process.env.GOOGLE_CLIENT_ID;
    if (expectedAud && info.aud !== expectedAud) {
      throw new UnauthorizedException('Google token audience mismatch');
    }

    const providerId = `google:${sub}`;
    let user: UserRow | null | undefined = (
      await this.db.select().from(users).where(eq(users.providerId, providerId))
    )[0];
    if (!user) {
      [user] = await this.db.select().from(users).where(eq(users.email, email));
      if (user) {
        [user] = await this.db
          .update(users)
          .set({ provider: 'google', providerId, verified: true, avatar: user.avatar ?? info.picture ?? null })
          .where(eq(users.id, user.id))
          .returning();
      } else {
        const fullName = info.name ?? email;
        const [firstName, ...rest] = fullName.trim().split(/\s+/);
        const lastName = rest.join(' ') || '—';
        const role = (dto.role ?? 'BUYER') as (typeof users.$inferInsert)['role'];
        const referralCode = await this.referralsService.ensureCodeForNewUser();
        const insertValues: typeof users.$inferInsert = {
          email,
          firstName: firstName ?? 'User',
          lastName,
          role,
          verified: true,
          provider: 'google',
          providerId,
          avatar: info.picture,
          referralCode,
        };
        [user] = await this.db.insert(users).values(insertValues).returning();
        if (dto.referralCode) {
          await this.applyReferralOnSignup(user!, dto.referralCode);
        }
      }
    }
    if (!user) throw new Error('Failed to resolve Google user');

    await this.audit.log({
      entityType: 'User',
      entityId: user.id,
      action: 'OAUTH_LOGIN',
      actor: { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` },
      metadata: { provider: 'google', subject: sub },
    });

    this.activityService
      .awardForUser(user.id, user.role, 'daily_login', { id: user.id, role: user.role, name: `${user.firstName} ${user.lastName}` })
      .catch(() => {});

    return this.generateTokens(user);
  }

  private generateTokens(user: UserRow) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(32).toString('hex');

    this.refreshStore.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        verified: user.verified,
        avatar: user.avatar,
      },
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
