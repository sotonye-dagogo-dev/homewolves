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
import { randomUUID } from 'node:crypto';
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
  hashPassword,
  verifyPassword,
  isValidPassword,
  encodeResetToken,
  decodeResetToken,
  sendResetEmail,
} from '@/lib/server/auth-local';

export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

// ─── Backend proxy detection (mirrors catch-all route.ts) ───────────────────
function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/^www\./, '');
}

function isSameSite(a: string, b: string): boolean {
  if (!a || !b) return false;
  const na = normalizeHost(a);
  const nb = normalizeHost(b);
  return na === nb;
}

function siteHost(): string {
  const siteRaw = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';
  try {
    return new URL(siteRaw).host;
  } catch {
    return '';
  }
}

function backendOrigin(req?: NextRequest): string | null {
  const explicit = process.env.API_PROXY_URL?.trim() || process.env.API_URL?.trim();
  if (explicit && explicit.length > 0) {
    try {
      const expHost = new URL(explicit).host;
      // Single-service Vercel deploys share apex/www between web + API.
      // Proxying to a same-site origin would loop back into this same
      // route (opaque 500s) — handle locally instead. Only proxy when the
      // explicit target is truly off-site.
      if (siteHost() && isSameSite(expHost, siteHost())) return null;
      if (req) {
        try {
          if (isSameSite(expHost, req.nextUrl.host)) return null;
        } catch {
          // ignore — fall through to proxy
        }
      }
      return new URL(explicit).origin;
    } catch {
      return null;
    }
  }
  const pub = process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';
  if (!pub || pub.startsWith('/')) return null;
  try {
    const u = new URL(pub);
    const sh = siteHost();
    // Treat apex ↔ www as the same site (Vercel 308s apex → www; fetching
    // the apex from a www page fails CORS with no ACAO header). Same-site
    // means: handle locally via Postgres, never proxy.
    if (sh && isSameSite(u.host, sh)) return null;
    if (req) {
      try {
        if (isSameSite(u.host, req.nextUrl.host)) return null;
      } catch {
        // ignore
      }
    }
    return u.origin;
  } catch {
    return null;
  }
}

async function proxyToBackend(req: NextRequest, action: string): Promise<NextResponse> {
  const origin = backendOrigin(req);
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

/**
 * Attempts the external-backend proxy; returns a response to send directly,
 * or `null` when the caller should fall through to local Postgres handling.
 *
 * Fallback rule (resilience while the external system is unreachable —
 * removable later): no configured origin → null; network/502 → null;
 * upstream 5xx → null (local DB path is tried instead of surfacing an opaque
 * 500). Upstream 2xx/4xx are returned as-is to preserve backend semantics.
 */
async function tryProxy(req: NextRequest, action: string): Promise<NextResponse | null> {
  if (!backendOrigin(req)) return null;
  const proxied = await proxyToBackend(req, action);
  if (proxied.status >= 500) {
    console.error(`[auth:${action}] backend ${proxied.status} — falling back to local handling`);
    return null;
  }
  return proxied;
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

function pgOptionsFor(url: string): Record<string, unknown> {
  // Config-driven postgres.js options (serverless-safe defaults):
  // - `prepare: false` by default. Supabase/pgbouncer poolers (port 6543,
  //   transaction mode) do NOT support prepared statements — every query
  //   fails otherwise, surfacing as opaque 500s on auth. Opt back in with
  //   PG_PREPARE=true (direct connections only).
  // - `ssl: 'require'` for non-local hosts (Supabase mandates TLS). Opt out
  //   with PG_SSL=disable or ?sslmode=disable.
  const prepare = process.env.PG_PREPARE?.trim().toLowerCase() === 'true';
  let ssl: unknown;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    const sslParam = (u.searchParams.get('sslmode') ?? '').toLowerCase();
    const sslEnv = (process.env.PG_SSL ?? '').trim().toLowerCase();
    if (sslEnv === 'disable' || sslParam === 'disable') {
      ssl = false;
    } else if (!isLocal) {
      ssl = 'require';
    }
  } catch {
    // Unparseable URL — let postgres throw its own descriptive error.
  }
  const opts: Record<string, unknown> = { max: 5, idle_timeout: 20, connect_timeout: 10, prepare };
  if (ssl !== undefined) opts.ssl = ssl;
  return opts;
}

async function getSql(): Promise<SqlClient | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!sqlPromise) {
    sqlPromise = (async () => {
      const postgres = (await import('postgres')).default;
      return postgres(url, pgOptionsFor(url)) as unknown as SqlClient;
    })();
  }
  try {
    return await sqlPromise;
  } catch {
    sqlPromise = null;
    return null;
  }
}

/**
 * Sanitized DB-error detail for server logs. Includes driver message/code
 * (needed to diagnose prod 500s) but never the connection string or query
 * parameters.
 */
function dbErrorDetail(err: unknown): { message: string; code?: string } {
  if (err instanceof Error) {
    const code = (err as Error & { code?: unknown }).code;
    return { message: err.message.slice(0, 300), code: typeof code === 'string' ? code : undefined };
  }
  return { message: String(err).slice(0, 300) };
}

function logDbError(tag: string, err: unknown): void {
  const detail = dbErrorDetail(err);
  console.error(tag, detail.code ? `${detail.code}: ${detail.message}` : detail.message);
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
    VALUES (${randomUUID()}, ${normalized}, ${referrer.id as string}, ${userId}, 'active', now())
    ON CONFLICT ("referredId") DO NOTHING
  `;
}

// ─── Handlers ───────────────────────────────────────────────────────────────

async function ensureAuthColumns(sql: SqlClient): Promise<boolean> {
  try {
    await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT`;
    return true;
  } catch (err) {
    // Table may not exist in fallback mode, or the connection role may lack
    // DDL permission — callers must handle a `false` result gracefully
    // instead of failing later with a cryptic insert error.
    logDbError('[auth] ensure passwordHash column failed', err);
    return false;
  }
}

function isMissingColumnError(err: unknown): boolean {
  const detail = err instanceof Error ? err.message : String(err);
  return /passwordHash/i.test(detail) || /column.*does not exist/i.test(detail) || /undefined_column/i.test(detail);
}

function isUniqueViolationError(err: unknown): boolean {
  const detail = err instanceof Error ? err.message : String(err);
  const code = err instanceof Error ? (err as Error & { code?: unknown }).code : undefined;
  return code === '23505' || /duplicate key|unique constraint|already exists/i.test(detail);
}

function isMissingTableError(err: unknown): boolean {
  const detail = err instanceof Error ? err.message : String(err);
  const code = err instanceof Error ? (err as Error & { code?: unknown }).code : undefined;
  return (
    code === '42P01' ||
    /relation .* does not exist/i.test(detail) ||
    /table .* does not exist/i.test(detail) ||
    /undefined_table/i.test(detail)
  );
}

async function handleRegisterPassword(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.', code: 'BAD_JSON' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const role = ['BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER'].includes(body.role as string) ? (body.role as string) : 'BUYER';
  const referralCode = typeof body.referralCode === 'string' ? body.referralCode : '';

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  if (!firstName || !lastName) {
    return NextResponse.json({ message: 'Enter your first and last name.' }, { status: 400 });
  }

  const proxied_register_password = await tryProxy(req, 'register-password');
  if (proxied_register_password) return proxied_register_password;

  const sql = await getSql();
  if (!sql) {
    console.error('[auth:register-password] DATABASE_URL not configured');
    return notConfigured();
  }
  const columnsOk = await ensureAuthColumns(sql);

  let existing: Row | null = null;
  try {
    existing = await findUserByEmail(sql, email);
  } catch (err) {
    logDbError('[auth:register-password] lookup failed', err);
    if (isMissingTableError(err)) {
      return NextResponse.json(
        {
          message: 'Database tables are not set up yet. Migrations run automatically on the next Vercel build — please try again shortly.',
          code: 'DB_NOT_MIGRATED',
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { message: 'Could not reach the database. Please try again.', code: 'DB_LOOKUP_FAILED' },
      { status: 500 },
    );
  }
  if (existing) {
    return NextResponse.json({ message: 'This email already has an account. Try signing in instead.', code: 'EMAIL_CONFLICT' }, { status: 409 });
  }
  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch (err) {
    logDbError('[auth:register-password] hash failed', err);
    return NextResponse.json(
      { message: 'Could not create your account. Please try again.', code: 'HASH_FAILED' },
      { status: 500 },
    );
  }
  let newCode: string;
  try {
    newCode = await ensureReferralCode(sql);
  } catch (err) {
    logDbError('[auth:register-password] referral-code failed', err);
    return NextResponse.json(
      { message: 'Could not create your account. Please try again.', code: 'REFERRAL_FAILED' },
      { status: 500 },
    );
  }
  let user: Row | null = null;
  const insertUser = () => sql`
      INSERT INTO "User" (id, email, "firstName", "lastName", phone, role, verified, "passwordHash", "referralCode", preferences, "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${email}, ${firstName}, ${lastName}, ${phone || null}, ${role}::"UserRole", false, ${passwordHash}, ${newCode}, '{}'::jsonb, now(), now())
      RETURNING *
    `;
  try {
    const rows = await insertUser();
    user = rows[0] ?? null;
  } catch (err) {
    if (isUniqueViolationError(err)) {
      // Race with another signup (or a duplicate phone/identifier): report a
      // clean 409 instead of the misleading MISSING_PASSWORD_COLUMN 503.
      logDbError('[auth:register-password] insert hit unique violation', err);
      return NextResponse.json(
        { message: 'An account with those details already exists. Try signing in instead.', code: 'EMAIL_CONFLICT' },
        { status: 409 },
      );
    }
    // First insert failed — the passwordHash column may have been missing
    // (pre-migration DBs, or the earlier ALTER lacked DDL permission).
    // Re-run the ALTER once and retry before giving up.
    if (isMissingColumnError(err)) {
      logDbError('[auth:register-password] insert hit missing column, re-ensuring + retrying', err);
      await ensureAuthColumns(sql);
      try {
        const rows = await insertUser();
        user = rows[0] ?? null;
      } catch (retryErr) {
        if (isUniqueViolationError(retryErr)) {
          return NextResponse.json(
            { message: 'An account with those details already exists. Try signing in instead.', code: 'EMAIL_CONFLICT' },
            { status: 409 },
          );
        }
        logDbError('[auth:register-password] insert retry failed', retryErr);
      }
    } else {
      logDbError('[auth:register-password] insert failed', err);
    }
  }
  if (!user) {
    // Column still missing after retry (or another persistent DB problem):
    // surface 503 with an actionable code so ops know to run migration
    // 0004, instead of a generic 500.
    const hint = !columnsOk
      ? 'The database role could not alter the User table. Run migration 0004 (passwordHash) manually and retry.'
      : 'Could not create your account. Please try again.';
    return NextResponse.json(
      { message: hint, code: 'MISSING_PASSWORD_COLUMN' },
      { status: 503 },
    );
  }
  if (referralCode) {
    try { await applyReferral(sql, user.id as string, referralCode); } catch { /* ignore */ }
  }
  // Send verification OTP (email verification flow)
  const otp = generateOtp();
  await sendOtpEmail(email, otp, firstName);
  let res: NextResponse;
  try {
    res = NextResponse.json(issueTokens(user as never));
  } catch (err) {
    // JWT_SECRET missing in production throws here — surface as 503, not 500.
    logDbError('[auth:register-password] token issue failed (check JWT_SECRET)', err);
    return NextResponse.json(
      { message: 'Sign-up is temporarily unavailable. Please try again shortly.', code: 'TOKEN_CONFIG' },
      { status: 503 },
    );
  }
  try {
    res.cookies.set(
      OTP_COOKIE,
      encodeOtpCookie({ email, otp, exp: Date.now() + 10 * 60 * 1000, purpose: 'register' }),
      otpCookieOptions(),
    );
  } catch (err) {
    logDbError('[auth:register-password] otp cookie failed (check JWT_SECRET)', err);
    return NextResponse.json(
      { message: 'Sign-up is temporarily unavailable. Please try again shortly.', code: 'TOKEN_CONFIG' },
      { status: 503 },
    );
  }
  return res;
}

async function handleLoginPassword(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!isValidEmail(email) || !password) {
    return NextResponse.json({ message: 'Enter your email and password.' }, { status: 400 });
  }

  const proxied_login_password = await tryProxy(req, 'login-password');
  if (proxied_login_password) return proxied_login_password;

  const sql = await getSql();
  if (!sql) return notConfigured();
  await ensureAuthColumns(sql);

  try {
    const user = await findUserByEmail(sql, email);
    if (!user) {
      return NextResponse.json({ message: 'Email or password is incorrect.' }, { status: 401 });
    }
    const stored = user.passwordHash as string | null | undefined;
    if (!stored) {
      return NextResponse.json({ message: 'This account uses email-code sign-in. Continue with email code or set a password via Forgot password.' }, { status: 401 });
    }
    const ok = await verifyPassword(password, stored);
    if (!ok) {
      return NextResponse.json({ message: 'Email or password is incorrect.' }, { status: 401 });
    }
    try {
      return NextResponse.json(issueTokens(user as never));
    } catch (err) {
      logDbError('[auth:login-password] token issue failed (check JWT_SECRET)', err);
      return NextResponse.json(
        { message: 'Sign-in is temporarily unavailable. Please try again shortly.', code: 'TOKEN_CONFIG' },
        { status: 503 },
      );
    }
  } catch (err) {
    logDbError('[auth:login-password] sign-in failed', err);
    if (isMissingTableError(err)) {
      return NextResponse.json(
        {
          message: 'Database tables are not set up yet. Migrations run automatically on the next Vercel build — please try again shortly.',
          code: 'DB_NOT_MIGRATED',
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ message: 'Could not sign you in. Please try again.', code: 'DB_FAILED' }, { status: 500 });
  }
}

async function handleForgotPassword(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) {
    return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 });
  }

  const proxied_forgot_password = await tryProxy(req, 'forgot-password');
  if (proxied_forgot_password) return proxied_forgot_password;

  const sql = await getSql();
  if (!sql) return notConfigured();

  const user = await findUserByEmail(sql, email).catch(() => null);
  const token = encodeResetToken({ email, exp: Date.now() + 30 * 60 * 1000 });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';
  if (user) {
    await sendResetEmail(email, `${siteUrl.replace(/\/$/, '')}/auth?reset=${token}`);
  }
  // Always return success to avoid email enumeration; expose token outside production for e2e/dev.
  return NextResponse.json(
    process.env.NODE_ENV === 'production' ? { message: 'If that email has an account, a reset link is on its way.' } : { message: 'If that email has an account, a reset link is on its way.', resetToken: token },
  );
}

async function handleResetPassword(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!isValidPassword(password)) {
    return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  const state = decodeResetToken(token);
  if (!state) {
    return NextResponse.json({ message: 'That reset link is invalid or expired. Request a new one.' }, { status: 400 });
  }

  const proxied_reset_password = await tryProxy(req, 'reset-password');
  if (proxied_reset_password) return proxied_reset_password;

  const sql = await getSql();
  if (!sql) return notConfigured();
  await ensureAuthColumns(sql);

  try {
    const user = await findUserByEmail(sql, state.email);
    if (!user) return NextResponse.json({ message: 'That reset link is invalid or expired. Request a new one.' }, { status: 400 });
    const passwordHash = await hashPassword(password);
    const rows = await sql`
      UPDATE "User" SET "passwordHash" = ${passwordHash}, "updatedAt" = now()
      WHERE id = ${user.id as string}
      RETURNING *
    `;
    try {
      return NextResponse.json(issueTokens((rows[0] ?? user) as never));
    } catch (err) {
      console.error('[auth:reset-password] token issue failed (check JWT_SECRET)', err);
      return NextResponse.json(
        { message: 'Password updated, but sign-in is temporarily unavailable. Try signing in shortly.', code: 'TOKEN_CONFIG' },
        { status: 503 },
      );
    }
  } catch (err) {
    console.error('[auth:reset-password] reset failed', err);
    return NextResponse.json({ message: 'Could not reset your password. Please try again.', code: 'DB_FAILED' }, { status: 500 });
  }
}

async function handleRegister(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) {
    return NextResponse.json({ message: 'Invalid email address' }, { status: 400 });
  }

  const proxied_register = await tryProxy(req, 'register');
  if (proxied_register) return proxied_register;

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

  const proxied_login = await tryProxy(req, 'login');
  if (proxied_login) return proxied_login;

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

  const proxied_verify_otp = await tryProxy(req, 'verify-otp');
  if (proxied_verify_otp) return proxied_verify_otp;

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
      VALUES (${randomUUID()}, ${email}, 'New', 'User', 'BUYER', true, ${referralCode}, '{}'::jsonb, now(), now())
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

  const proxied_complete_profile = await tryProxy(req, 'complete-profile');
  if (proxied_complete_profile) return proxied_complete_profile;

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
      VALUES (${randomUUID()}, ${email}, ${firstName}, ${lastName}, ${phone}, ${role}::"UserRole", true, ${newCode}, '{}'::jsonb, now(), now())
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

  const proxied_google = await tryProxy(req, 'google');
  if (proxied_google) return proxied_google;

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
        VALUES (${randomUUID()}, ${email}, ${firstName ?? 'User'}, ${rest.join(' ') || '—'}, 'BUYER', true, 'google', ${providerId},
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

  const proxied_supabase = await tryProxy(req, 'supabase');
  if (proxied_supabase) return proxied_supabase;

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
        VALUES (${randomUUID()}, ${email}, ${firstName ?? 'User'}, ${rest.join(' ') || '—'}, 'BUYER', true, 'supabase', ${providerId},
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
  const proxied_logout = await tryProxy(req, 'logout');
  if (proxied_logout) return proxied_logout;
  // Local mode: stateless JWT — client drops the token; clear OTP cookie if any.
  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.set(OTP_COOKIE, '', { ...otpCookieOptions(), maxAge: 0 });
  return res;
}

async function handleRefresh(req: NextRequest): Promise<NextResponse> {
  const proxied_refresh = await tryProxy(req, 'refresh');
  if (proxied_refresh) return proxied_refresh;

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
  // Outer guard: no auth action may ever surface an opaque HTML 500. Any
  // unexpected throw becomes structured JSON with a code the client can
  // display and ops can grep in Vercel logs.
  try {
    switch (action) {
      case 'register':
        return handleRegister(req);
      case 'register-password':
        return handleRegisterPassword(req);
      case 'login-password':
        return handleLoginPassword(req);
      case 'forgot-password':
        return handleForgotPassword(req);
      case 'reset-password':
        return handleResetPassword(req);
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
  } catch (err) {
    logDbError(`[auth:${action}] unexpected failure`, err);
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.', code: 'UNEXPECTED' },
      { status: 500 },
    );
  }
}
