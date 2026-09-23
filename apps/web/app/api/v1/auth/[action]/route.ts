/**
 * Auth route handlers — take precedence over the catch-all [...path] proxy
 * for /api/v1/auth/*.
 *
 * When API_PROXY_URL / an external NEXT_PUBLIC_API_URL is configured, requests
 * are proxied to the real NestJS API (same behaviour as the catch-all). When no
 * backend is configured (production today — no API is deployed), handlers run
 * locally against Postgres (DATABASE_URL) so email OTP / Google / Supabase auth
 * work end-to-end without a 502 "API not configured".
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  decodeOtpCookie,
  encodeOtpCookie,
  generateOtp,
  generateReferralCode,
  isValidEmail,
  issueTokens,
  otpCookieOptions,
  OTP_COOKIE,
  sendOtpEmail,
} from '@/lib/server/auth-local';

export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

// ─── Backend proxy detection (mirrors catch-all route.ts) ───────────────────
function backendOrigin(): string | null {
  const explicit = process.env.API_PROXY_URL?.trim() || process.env.API_URL?.trim();
  if (explicit && explicit.length > 0) {
    try {
      return new URL(explicit).origin;
    } catch {
      return null;
    }
  }
  const pub = process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';
  if (!pub || pub.startsWith('/')) return null;
  try {
    const u = new URL(pub);
    const siteRaw = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';
    let siteHost = '';
    try {
      siteHost = new URL(siteRaw).host;
    } catch {
      siteHost = '';
    }
    if (siteHost && u.host === siteHost) return null;
    return u.origin;
  } catch {
    return null;
  }
}

async function proxyToBackend(req: NextRequest, action: string): Promise<NextResponse> {
  const origin = backendOrigin();
  if (!origin) return notConfigured();
  try {
    const headers: Record<string, string> = {};
    const auth = req.headers.get('authorization');
    if (auth) headers.authorization = auth;
    const contentType = req.headers.get('content-type');
    if (contentType) headers['content-type'] = contentType;
    const cookie = req.headers.get('cookie');
    if (cookie) headers.cookie = cookie;

    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text();
    const upstream = await fetch(`${origin}/api/v1/auth/${action}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });
    const text = await upstream.text();
    const out = new NextResponse(text, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
    });
    const setCookie = upstream.headers.getSetCookie?.() ?? [];
    for (const c of setCookie) out.headers.append('set-cookie', c);
    return out;
  } catch {
    return NextResponse.json({ message: 'Backend unavailable' }, { status: 502 });
  }
}

function notConfigured() {
  return NextResponse.json(
    {
      message: 'Auth requires DATABASE_URL to be configured',
      hint: 'Set DATABASE_URL (Supabase/Postgres) so local auth can persist users, or set API_PROXY_URL to a deployed NestJS API.',
    },
    { status: 503 },
  );
}

// ─── Local Postgres (lazy, serverless-friendly) ─────────────────────────────
type SqlClient = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Row[]>;
  end: () => Promise<void>;
};

let sqlPromise: Promise<SqlClient> | null = null;

async function getSql(): Promise<SqlClient | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!sqlPromise) {
    sqlPromise = (async () => {
      const postgres = (await import('postgres')).default;
      return postgres(url, { max: 5, idle_timeout: 20, connect_timeout: 10 }) as unknown as SqlClient;
    })();
  }
  try {
    return await sqlPromise;
  } catch {
    sqlPromise = null;
    return null;
  }
}

async function findUserByEmail(sql: SqlClient, email: string): Promise<Row | null> {
  const rows = await sql`SELECT * FROM "User" WHERE email = ${email} LIMIT 1`;
  return rows[0] ?? null;
}

async function findUserById(sql: SqlClient, id: string): Promise<Row | null> {
  const rows = await sql`SELECT * FROM "User" WHERE id = ${id} LIMIT 1`;
  return rows[0] ?? null;
}

async function ensureReferralCode(sql: SqlClient): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode();
    const rows = await sql`SELECT 1 FROM "User" WHERE "referralCode" = ${code} LIMIT 1`;
    if (rows.length === 0) return code;
  }
  return generateReferralCode() + Date.now().toString(36).toUpperCase().slice(-4);
}

async function applyReferral(sql: SqlClient, userId: string, code: string): Promise<void> {
  const normalized = code.trim().toUpperCase();
  const referrers = await sql`SELECT id FROM "User" WHERE "referralCode" = ${normalized} AND id <> ${userId} LIMIT 1`;
  const referrer = referrers[0];
  if (!referrer) return;
  await sql`UPDATE "User" SET "referredById" = ${referrer.id as string} WHERE id = ${userId}`;
  await sql`
    INSERT INTO "Referral" (id, code, "referrerId", "referredId", status, "createdAt")
    VALUES (${crypto.randomUUID()}, ${normalized}, ${referrer.id as string}, ${userId}, 'active', now())
    ON CONFLICT ("referredId") DO NOTHING
  `;
}

// ─── Handlers ───────────────────────────────────────────────────────────────

async function handleRegister(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) {
    return NextResponse.json({ message: 'Invalid email address' }, { status: 400 });
  }

  const origin = backendOrigin();
  if (origin) return proxyToBackend(req, 'register');

  const sql = await getSql();
  if (!sql) return notConfigured();

  const existing = await findUserByEmail(sql, email);
  if (existing) {
    return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
  }

  const otp = generateOtp();
  await sendOtpEmail(email, otp, typeof body.firstName === 'string' ? body.firstName : 'there');

  const res = NextResponse.json(
    process.env.NODE_ENV === 'production' ? { message: 'OTP sent' } : { message: 'OTP sent', otp },
  );
  res.cookies.set(
    OTP_COOKIE,
    encodeOtpCookie({ email, otp, exp: Date.now() + 10 * 60 * 1000, purpose: 'register' }),
    otpCookieOptions(),
  );
  return res;
}

async function handleLogin(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) {
    return NextResponse.json({ message: 'Invalid email address' }, { status: 400 });
  }

  const origin = backendOrigin();
  if (origin) return proxyToBackend(req, 'login');

  const sql = await getSql();
  if (!sql) return notConfigured();

  const user = await findUserByEmail(sql, email);
  if (!user) {
    return NextResponse.json({ message: 'No account found with this email' }, { status: 401 });
  }

  const otp = generateOtp();
  await sendOtpEmail(email, otp, (user.firstName as string) || 'there');

  const res = NextResponse.json(
    process.env.NODE_ENV === 'production' ? { message: 'OTP sent' } : { message: 'OTP sent', otp },
  );
  res.cookies.set(
    OTP_COOKIE,
    encodeOtpCookie({ email, otp, exp: Date.now() + 10 * 60 * 1000, purpose: 'login' }),
    otpCookieOptions(),
  );
  return res;
}

async function handleVerifyOtp(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
  if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }

  const origin = backendOrigin();
  if (origin) return proxyToBackend(req, 'verify-otp');

  const sql = await getSql();
  if (!sql) return notConfigured();

  const state = decodeOtpCookie(req.cookies.get(OTP_COOKIE)?.value);
  if (!state || state.email !== email) {
    return NextResponse.json({ message: 'OTP expired or not found' }, { status: 401 });
  }
  if (state.otp !== otp) {
    return NextResponse.json({ message: 'Invalid OTP' }, { status: 401 });
  }

  let user = await findUserByEmail(sql, email);
  if (!user) {
    const referralCode = await ensureReferralCode(sql);
    const rows = await sql`
      INSERT INTO "User" (id, email, "firstName", "lastName", role, verified, "referralCode", preferences, "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${email}, 'New', 'User', 'BUYER', true, ${referralCode}, '{}'::jsonb, now(), now())
      RETURNING *
    `;
    user = rows[0] ?? null;
    if (!user) {
      return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
    }
  }

  const res = NextResponse.json(issueTokens(user as never));
  res.cookies.set(OTP_COOKIE, '', { ...otpCookieOptions(), maxAge: 0 });
  return res;
}

async function handleCompleteProfile(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const role = ['BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER'].includes(body.role) ? body.role : 'BUYER';
  const referralCode = typeof body.referralCode === 'string' ? body.referralCode : '';

  if (!isValidEmail(email) || !firstName || !lastName || phone.length < 7) {
    return NextResponse.json({ message: 'Invalid profile data' }, { status: 400 });
  }

  const origin = backendOrigin();
  if (origin) return proxyToBackend(req, 'complete-profile');

  const sql = await getSql();
  if (!sql) return notConfigured();

  let user = await findUserByEmail(sql, email);
  if (user) {
    const rows = await sql`
      UPDATE "User"
      SET "firstName" = ${firstName}, "lastName" = ${lastName}, phone = ${phone}, role = ${role}::"UserRole", "updatedAt" = now()
      WHERE id = ${user.id as string}
      RETURNING *
    `;
    user = rows[0] ?? user;
  } else {
    const newCode = await ensureReferralCode(sql);
    const rows = await sql`
      INSERT INTO "User" (id, email, "firstName", "lastName", phone, role, verified, "referralCode", preferences, "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${email}, ${firstName}, ${lastName}, ${phone}, ${role}::"UserRole", true, ${newCode}, '{}'::jsonb, now(), now())
      RETURNING *
    `;
    user = rows[0] ?? null;
    if (!user) return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
  }

  if (referralCode) {
    try {
      await applyReferral(sql, user.id as string, referralCode);
    } catch {
      // Invalid referral must not block profile completion.
    }
  }

  return NextResponse.json(issueTokens(user as never));
}

async function handleGoogle(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const credential = typeof body.credential === 'string' ? body.credential : '';
  if (!credential) {
    return NextResponse.json({ message: 'Missing Google credential' }, { status: 400 });
  }

  const origin = backendOrigin();
  if (origin) return proxyToBackend(req, 'google');

  const sql = await getSql();
  if (!sql) return notConfigured();

  let info: Record<string, unknown>;
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!res.ok) throw new Error(`tokeninfo ${res.status}`);
    info = await res.json();
  } catch {
    return NextResponse.json({ message: 'Invalid Google credential' }, { status: 401 });
  }

  const email = typeof info.email === 'string' ? info.email : '';
  const sub = typeof info.sub === 'string' ? info.sub : '';
  if (!email || !sub || info.email_verified !== 'true') {
    return NextResponse.json({ message: 'Google token missing verified email' }, { status: 401 });
  }
  const expectedAud = process.env.GOOGLE_CLIENT_ID;
  if (expectedAud && info.aud !== expectedAud) {
    return NextResponse.json({ message: 'Google token audience mismatch' }, { status: 401 });
  }

  const providerId = `google:${sub}`;
  let user: Row | null = (
    await sql`SELECT * FROM "User" WHERE "providerId" = ${providerId} LIMIT 1`
  )[0] ?? null;

  if (!user) {
    user = (await findUserByEmail(sql, email)) as Row | null;
    if (user) {
      const rows = await sql`
        UPDATE "User"
        SET provider = 'google', "providerId" = ${providerId}, verified = true,
            avatar = COALESCE(avatar, ${typeof info.picture === 'string' ? info.picture : null})
        WHERE id = ${user.id as string}
        RETURNING *
      `;
      user = rows[0] ?? user;
    } else {
      const fullName = typeof info.name === 'string' ? info.name : email;
      const [firstName, ...rest] = fullName.trim().split(/\s+/);
      const newCode = await ensureReferralCode(sql);
      const rows = await sql`
        INSERT INTO "User" (id, email, "firstName", "lastName", role, verified, provider, "providerId", avatar, "referralCode", preferences, "createdAt", "updatedAt")
        VALUES (${crypto.randomUUID()}, ${email}, ${firstName ?? 'User'}, ${rest.join(' ') || '—'}, 'BUYER', true, 'google', ${providerId},
                ${typeof info.picture === 'string' ? info.picture : null}, ${newCode}, '{}'::jsonb, now(), now())
        RETURNING *
      `;
      user = rows[0] ?? null;
      if (!user) return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
      const refCode = typeof body.referralCode === 'string' ? body.referralCode : '';
      if (refCode) {
        try {
          await applyReferral(sql, user.id as string, refCode);
        } catch {
          // ignore invalid referral
        }
      }
    }
  }

  return NextResponse.json(issueTokens(user as never));
}

async function handleSupabase(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const accessToken = typeof body.accessToken === 'string' ? body.accessToken : '';
  if (!accessToken) {
    return NextResponse.json({ message: 'Missing access token' }, { status: 400 });
  }

  const origin = backendOrigin();
  if (origin) return proxyToBackend(req, 'supabase');

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ message: 'Supabase auth is not configured' }, { status: 401 });
  }

  // Verify Supabase HS256 JWT manually (no external deps).
  let payload: Record<string, unknown>;
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) throw new Error('malformed');
    const { createHmac, timingSafeEqual } = await import('node:crypto');
    const [h, p, s] = parts as [string, string, string];
    const expected = createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url');
    const a = Buffer.from(s);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('bad sig');
    payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('expired');
    }
  } catch {
    return NextResponse.json({ message: 'Invalid or expired Supabase session' }, { status: 401 });
  }

  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  const email = typeof payload.email === 'string' ? payload.email : '';
  if (!sub || !email) {
    return NextResponse.json({ message: 'Supabase session is missing identity' }, { status: 401 });
  }

  const sql = await getSql();
  if (!sql) return notConfigured();

  const providerId = `supabase:${sub}`;
  const metadata = (payload.user_metadata ?? payload.app_metadata ?? {}) as Record<string, unknown>;
  let user: Row | null = (
    await sql`SELECT * FROM "User" WHERE "providerId" = ${providerId} LIMIT 1`
  )[0] ?? null;

  if (!user) {
    user = (await findUserByEmail(sql, email)) as Row | null;
    if (user) {
      const rows = await sql`
        UPDATE "User"
        SET provider = 'supabase', "providerId" = ${providerId}, verified = true,
            avatar = COALESCE(avatar, ${typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null})
        WHERE id = ${user.id as string}
        RETURNING *
      `;
      user = rows[0] ?? user;
    } else {
      const fullName =
        (typeof metadata.full_name === 'string' && metadata.full_name) ||
        (typeof metadata.name === 'string' && metadata.name) ||
        email;
      const [firstName, ...rest] = fullName.trim().split(/\s+/);
      const newCode = await ensureReferralCode(sql);
      const rows = await sql`
        INSERT INTO "User" (id, email, "firstName", "lastName", role, verified, provider, "providerId", avatar, "referralCode", preferences, "createdAt", "updatedAt")
        VALUES (${crypto.randomUUID()}, ${email}, ${firstName ?? 'User'}, ${rest.join(' ') || '—'}, 'BUYER', true, 'supabase', ${providerId},
                ${typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null}, ${newCode}, '{}'::jsonb, now(), now())
        RETURNING *
      `;
      user = rows[0] ?? null;
      if (!user) return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
    }
  }

  return NextResponse.json(issueTokens(user as never));
}

async function handleLogout(req: NextRequest): Promise<NextResponse> {
  const origin = backendOrigin();
  if (origin) return proxyToBackend(req, 'logout');
  // Local mode: stateless JWT — client drops the token; clear OTP cookie if any.
  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.set(OTP_COOKIE, '', { ...otpCookieOptions(), maxAge: 0 });
  return res;
}

async function handleRefresh(req: NextRequest): Promise<NextResponse> {
  const origin = backendOrigin();
  if (origin) return proxyToBackend(req, 'refresh');

  const body = await req.json().catch(() => ({}));
  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : '';
  const { verifyJwt } = await import('@/lib/server/auth-local');
  const payload = verifyJwt(refreshToken);
  if (!payload || payload.typ !== 'refresh') {
    return NextResponse.json({ message: 'Invalid or expired refresh token' }, { status: 401 });
  }
  const sql = await getSql();
  if (!sql) return notConfigured();
  const user = await findUserById(sql, payload.sub);
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 401 });
  return NextResponse.json(issueTokens(user as never));
}

// ─── Router ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, ctx: { params: { action: string } }) {
  const action = ctx.params.action;
  switch (action) {
    case 'register':
      return handleRegister(req);
    case 'login':
      return handleLogin(req);
    case 'verify-otp':
      return handleVerifyOtp(req);
    case 'complete-profile':
      return handleCompleteProfile(req);
    case 'google':
      return handleGoogle(req);
    case 'supabase':
      return handleSupabase(req);
    case 'logout':
      return handleLogout(req);
    case 'refresh':
      return handleRefresh(req);
    default:
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
}
