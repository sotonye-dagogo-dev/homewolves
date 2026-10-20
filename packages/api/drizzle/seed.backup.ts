/**
 * Backup + restore for destructive seed operations (revert / purge).
 *
 * Philosophy: nothing destructive ever runs without a capture-first safety net.
 * A backup is a single timestamped JSON file containing the exact rows that
 * the destructive operation is about to touch (seed scope) or every row in
 * every table (full scope). If the backup cannot be written, the destructive
 * operation MUST NOT proceed — callers abort on the thrown error.
 *
 * Scope:
 *  - `seed`: only rows matching the seed manifest (seed- ID prefixes and
 *    manifest keys) — i.e. exactly what `db:seed:revert` deletes.
 *  - `full`: every row of every table — required before `db:seed:purge`.
 *
 * Restore (`db:restore`) re-inserts rows in parents-first order with
 * ON CONFLICT DO NOTHING, so it is idempotent and never overwrites rows that
 * already exist. Values are JSON round-tripped (dates become ISO strings,
 * which Postgres casts back for timestamptz/jsonb/array columns); restore
 * assumes the same schema version as the backup.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../src/drizzle/schema';
import { TABLE_REGISTRY, TABLES_PARENTS_FIRST, type Row } from './table.registry';

type DbType = PostgresJsDatabase<typeof schema>;

export const BACKUP_FORMAT_VERSION = 1;

export type BackupScope = 'seed' | 'full';

export interface SeedBackupFile {
  meta: {
    version: number;
    scope: BackupScope;
    createdAt: string;
    /** DB host only (never credentials) for provenance. */
    dbHost: string;
    counts: Record<string, number>;
    totalRows: number;
  };
  tables: Record<string, Row[]>;
}

/** Backup destination — `SEED_BACKUP_DIR` override or `drizzle/backups/` (gitignored). */
export function backupDir(): string {
  return process.env.SEED_BACKUP_DIR?.trim() || path.resolve(__dirname, 'backups');
}

/** Host only — provenance without leaking credentials into backup files. */
function safeDbHost(): string {
  try {
    return new URL(process.env.DATABASE_URL ?? '').host || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Captures rows for every table in the registry. Seed scope skips tables with
 * no seed-scoped rows. Throws on the first table that fails — a backup that
 * captured only part of the data must never authorize a destructive run.
 */
export async function collectBackup(db: DbType, scope: BackupScope): Promise<SeedBackupFile> {
  const tables: Record<string, Row[]> = {};
  const counts: Record<string, number> = {};
  let totalRows = 0;

  for (const ref of TABLE_REGISTRY) {
    let rows: Row[] = [];
    if (scope === 'full' || ref.seedWhere) {
      try {
        const sel = db.select() as unknown as {
          from: (table: unknown) => PromiseLike<Row[]> & { where: (cond: unknown) => PromiseLike<Row[]> };
        };
        rows = scope === 'full'
          ? await sel.from(ref.table)
          : await sel.from(ref.table).where(ref.seedWhere as never);
      } catch (err) {
        throw new Error(
          `Backup failed for table "${ref.key}" — aborting, nothing was deleted: ${(err as Error).message}`,
        );
      }
    }
    tables[ref.key] = rows;
    counts[ref.key] = rows.length;
    totalRows += rows.length;
  }

  return {
    meta: {
      version: BACKUP_FORMAT_VERSION,
      scope,
      createdAt: new Date().toISOString(),
      dbHost: safeDbHost(),
      counts,
      totalRows,
    },
    tables,
  };
}

/** Writes the backup atomically-ish (write then rename) and returns the path. */
export function writeBackupFile(file: SeedBackupFile, dir: string = backupDir()): string {
  fs.mkdirSync(dir, { recursive: true });
  const stamp = file.meta.createdAt.replace(/[:.]/g, '-');
  const target = path.join(dir, `backup-${file.meta.scope}-${stamp}.json`);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(file), 'utf8');
  fs.renameSync(tmp, target);
  return target;
}

/** Convenience: collect + write. Throws if either step fails. */
export async function createBackup(db: DbType, scope: BackupScope, dir?: string): Promise<{ file: SeedBackupFile; path: string }> {
  const file = await collectBackup(db, scope);
  const written = writeBackupFile(file, dir);
  return { file, path: written };
}

/** Keep inserts under Postgres' 65535-bind-parameter limit for wide tables. */
const INSERT_CHUNK = 200;

/**
 * Re-inserts rows from a backup file in parents-first order using
 * ON CONFLICT DO NOTHING (idempotent; never overwrites existing rows).
 * Stops hard on the first failing table and reports what was restored so far.
 */
export async function restoreBackup(
  db: DbType,
  filePath: string,
): Promise<{ restored: Record<string, number> }> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file not found: ${filePath}`);
  }
  let file: SeedBackupFile;
  try {
    file = JSON.parse(fs.readFileSync(filePath, 'utf8')) as SeedBackupFile;
  } catch {
    throw new Error(`Backup file is not valid JSON: ${filePath}`);
  }
  if (!file || typeof file !== 'object' || file.meta?.version !== BACKUP_FORMAT_VERSION || !file.tables || typeof file.tables !== 'object') {
    throw new Error(`Unrecognized backup format (expected version ${BACKUP_FORMAT_VERSION}): ${filePath}`);
  }

  const restored: Record<string, number> = {};
  for (const ref of TABLES_PARENTS_FIRST) {
    const rows = file.tables[ref.key];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    try {
      for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
        const chunk = rows.slice(i, i + INSERT_CHUNK);
        const ins = db.insert(ref.table) as unknown as {
          values: (values: Row[]) => { onConflictDoNothing: () => PromiseLike<unknown> };
        };
        await ins.values(chunk).onConflictDoNothing();
      }
      restored[ref.key] = rows.length;
    } catch (err) {
      throw new Error(
        `Restore failed for table "${ref.key}" — remaining tables were NOT restored (already restored: ${Object.keys(restored).join(', ') || 'none'}): ${(err as Error).message}`,
      );
    }
  }
  return { restored };
}
