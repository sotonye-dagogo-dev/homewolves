import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrizzleService.name);
  private client?: ReturnType<typeof postgres>;
  private _db?: Database;

  async onModuleInit() {
    try {
      const connectionString =
        process.env.DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5432/homewolves?schema=public';
      // Serverless-safe postgres.js options (mirrors web auth-local route):
      // Supabase/pgbouncer poolers (port 6543, transaction mode) do NOT
      // support prepared statements — every query fails otherwise, surfacing
      // as opaque 500s on auth. Default prepare:false; opt back in with
      // PG_PREPARE=true (direct connections only). TLS required for non-local
      // hosts unless PG_SSL=disable or ?sslmode=disable.
      const prepare = (process.env.PG_PREPARE ?? '').trim().toLowerCase() === 'true';
      let ssl: unknown;
      try {
        const u = new URL(connectionString);
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
      const opts: Record<string, unknown> = {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        onnotice: () => {},
        prepare,
      };
      if (ssl !== undefined) (opts as Record<string, unknown>).ssl = ssl;
      this.client = postgres(connectionString, opts as never);
      this._db = drizzle(this.client, { schema });
      this.logger.log('Drizzle connected');
    } catch (err) {
      this.logger.warn(`Drizzle connection failed (falling back gracefully): ${(err as Error).message}`);
    }
  }

  get db(): Database {
    if (!this._db) {
      throw new Error('Drizzle not initialised — check DATABASE_URL');
    }
    return this._db;
  }

  get isConnected(): boolean {
    return this._db != null;
  }

  get query(): Database['query'] {
    return this.db.query;
  }

  get select(): Database['select'] {
    return this.db.select.bind(this.db);
  }

  get insert(): Database['insert'] {
    return this.db.insert.bind(this.db);
  }

  get update(): Database['update'] {
    return this.db.update.bind(this.db);
  }

  get delete(): Database['delete'] {
    return this.db.delete.bind(this.db);
  }

  get execute(): Database['execute'] {
    return this.db.execute.bind(this.db);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.end({ timeout: 5 });
      this._db = undefined;
    }
  }
}
