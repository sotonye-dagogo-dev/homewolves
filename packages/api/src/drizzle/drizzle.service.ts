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
      this.client = postgres(connectionString, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        onnotice: () => {},
      });
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
