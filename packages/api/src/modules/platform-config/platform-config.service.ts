import { Injectable, OnModuleInit } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { platformConfig } from '../../drizzle/schema';

@Injectable()
export class PlatformConfigService implements OnModuleInit {
  private cache = new Map<string, { value: unknown; expiresAt: number }>();
  private readonly TTL = 5 * 60 * 1000;

  constructor(private db: DrizzleService) {}

  async onModuleInit() {
    await this.warmCache();
  }

  private async warmCache() {
    try {
      const configs = await this.db.select().from(platformConfig);
      for (const config of configs) {
        this.cache.set(config.key, {
          value: config.value,
          expiresAt: Date.now() + this.TTL,
        });
      }
    } catch {
      // DB not available — cache stays cold, fallbacks will be used
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    try {
      const [config] = await this.db
        .select()
        .from(platformConfig)
        .where(eq(platformConfig.key, key));
      if (config) {
        this.cache.set(key, {
          value: config.value,
          expiresAt: Date.now() + this.TTL,
        });
        return config.value as T;
      }
    } catch {
      return this.envFallback<T>(key);
    }

    return this.envFallback<T>(key);
  }

  /** Env-derived fallback for keys with no admin-edited DB row yet. */
  private envFallback<T>(key: string): T | null {
    if (key === 'google_oauth') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (clientId) return { clientId, enabled: true } as unknown as T;
    }
    return null;
  }

  async getAll(): Promise<Record<string, unknown>> {
    try {
      const configs = await this.db.select().from(platformConfig);
      const map = configs.reduce(
        (acc, c) => {
          acc[c.key] = c.value;
          return acc;
        },
        {} as Record<string, unknown>,
      );
      if (!('google_oauth' in map)) {
        const fb = this.envFallback<unknown>('google_oauth');
        if (fb) map.google_oauth = fb;
      }
      return map;
    } catch {
      const fb = this.envFallback<unknown>('google_oauth');
      return fb ? { google_oauth: fb } : {};
    }
  }

  async set(key: string, value: unknown, updatedById: string): Promise<void> {
    await this.db
      .insert(platformConfig)
      .values({ key, value, updatedById })
      .onConflictDoUpdate({
        target: platformConfig.key,
        set: { value, updatedById },
      });
    this.cache.set(key, { value, expiresAt: Date.now() + this.TTL });
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }
}
