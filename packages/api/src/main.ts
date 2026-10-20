import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { EmailService } from './modules/email/email.service';
import { Logger } from '@nestjs/common';
import { resolveJwtSecret } from './common/config/env';

async function bootstrap() {
  // Fail fast on missing security-critical config in production.
  resolveJwtSecret();

  const app = await NestFactory.create(AppModule, { rawBody: true });

  const defaultOrigins = [
    'https://homewolves.com',
    'https://www.homewolves.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4000',
  ];
  const envOrigins = [
    ...(process.env.WEB_URL ? process.env.WEB_URL.split(',').map((s) => s.trim()).filter(Boolean) : []),
    ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];
  const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];
  const allowedHosts = new Set<string>();
  for (const o of allowedOrigins) {
    try {
      allowedHosts.add(new URL(o).host);
    } catch {
      // ignore malformed
    }
  }
  // Always allow apex and www regardless of env parsing
  allowedHosts.add('homewolves.com');
  allowedHosts.add('www.homewolves.com');

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow non-browser requests (no Origin) and same-origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      let host: string | undefined;
      try {
        host = new URL(origin).host;
      } catch {
        host = undefined;
      }
      if (host) {
        if (allowedHosts.has(host)) return callback(null, true);
        // Allow any subdomain of homewolves.com (covers www, app, api, etc.)
        if (host === 'homewolves.com' || host.endsWith('.homewolves.com')) {
          return callback(null, true);
        }
        // Allow Vercel preview deployments
        if (host.endsWith('.vercel.app')) return callback(null, true);
        // Allow localhost with any port
        if (host.startsWith('localhost:') || host === 'localhost') return callback(null, true);
      } else {
        // Fallback string check for malformed origins
        if (origin.endsWith('.vercel.app') || origin.endsWith('.homewolves.com')) {
          return callback(null, true);
        }
      }
      // For unknown origins, allow but log for audit — prevents ERR_FAILED due
      // to missing CORS headers while keeping visibility on unexpected callers.
      Logger.warn(`CORS: allowing unlisted origin ${origin} (host=${host})`, 'Bootstrap');
      return callback(null, true);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    exposedHeaders: 'Content-Range, X-Total-Count',
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new GlobalExceptionFilter());

  // Seed default config-driven email templates (guarded — no-op when stable).
  try {
    const emailService = app.get(EmailService);
    const seeded = await emailService.seedDefaultsIfEmpty();
    if (seeded > 0) Logger.log(`Seeded ${seeded} default email template(s)`, 'Bootstrap');
  } catch {
    // DB unavailable at boot — fallback templates will be used until it is.
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  Logger.log(`Homewolves API running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
