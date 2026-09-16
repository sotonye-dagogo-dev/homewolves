import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { PaystackClient } from '../../common/integrations/paystack.client';
import { DocuSealClient } from '../../common/integrations/docuseal.client';
import { SmsClient } from '../../common/integrations/sms.client';
import { StorageClient } from '../../common/integrations/storage.client';
import { EmailService } from '../email/email.service';

export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface ServiceHealth {
  status: HealthStatus;
  configured: boolean;
  latencyMs?: number;
  error?: string;
}

export interface HealthReport {
  status: HealthStatus;
  timestamp: string;
  version: string;
  services: Record<string, ServiceHealth>;
}

@Injectable()
export class HealthService {
  constructor(
    private db: DrizzleService,
    private paystack: PaystackClient,
    private docuseal: DocuSealClient,
    private sms: SmsClient,
    private storage: StorageClient,
    private email: EmailService,
  ) {}

  async liveness(): Promise<{ status: 'ok'; timestamp: string }> {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  async readiness(): Promise<HealthReport> {
    const services: Record<string, ServiceHealth> = {};
    let overall: HealthStatus = 'ok';

    const dbHealth = await this.checkDb();
    services.database = dbHealth;
    if ((dbHealth.status as HealthStatus) === 'down') overall = 'down';
    else if ((dbHealth.status as HealthStatus) === 'degraded' && (overall as HealthStatus) !== 'down') overall = 'degraded';

    services.paystack = { status: 'ok', configured: this.paystack.isConfigured };
    services.docuseal = { status: 'ok', configured: this.docuseal.isConfigured };
    services.sms = { status: 'ok', configured: this.sms.isConfigured };
    services.storage = { status: 'ok', configured: this.storage.isConfigured };
    services.email = { status: 'ok', configured: this.email.providerConfigured };
    services.redis = this.checkRedis();

    if ((overall as HealthStatus) === 'ok' && Object.values(services).some((s) => s.status === 'degraded')) overall = 'degraded';

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      services,
    };
  }

  private async checkDb(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.db.execute(sql`SELECT 1`);
      return { status: 'ok', configured: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { status: 'down', configured: false, latencyMs: Date.now() - start, error: (err as Error).message.slice(0, 200) };
    }
  }

  private checkRedis(): ServiceHealth {
    const configured = Boolean(process.env.REDIS_URL);
    return { status: 'ok', configured };
  }
}
