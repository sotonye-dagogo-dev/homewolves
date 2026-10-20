import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../src/drizzle/schema';
import { TABLE_REGISTRY, TABLES_CHILDREN_FIRST, TABLES_PARENTS_FIRST, type Row } from './table.registry';
import {
  BACKUP_FORMAT_VERSION,
  collectBackup,
  createBackup,
  restoreBackup,
  writeBackupFile,
  type SeedBackupFile,
} from './seed.backup';

type DbType = PostgresJsDatabase<typeof schema>;

/** Rows a fake table returns, keyed by registry key. */
type RowMap = Record<string, Row[]>;

interface FakeDbOptions {
  rows?: RowMap;
  failOn?: string;
}

interface FakeDb {
  db: DbType;
  queried: { key: string; whereUsed: boolean }[];
  inserted: { key: string; rows: Row[]; conflictMode: string }[];
}

/**
 * Minimal structural stand-in for the Drizzle DB: `select().from(table)` is
 * thenable and also exposes `.where()`; `insert(table).values(rows)` exposes
 * `.onConflictDoNothing()`. Table identity is resolved back to a registry key
 * so assertions can speak in table names.
 */
function createFakeDb(opts: FakeDbOptions = {}): FakeDb {
  const keyOf = (table: unknown): string =>
    TABLE_REGISTRY.find((ref) => ref.table === table)?.key ?? 'unknown';
  const rowsFor = (table: unknown): Row[] => opts.rows?.[keyOf(table)] ?? [];

  const queried: FakeDb['queried'] = [];
  const inserted: FakeDb['inserted'] = [];

  const db = {
    select: () => ({
      from: (table: unknown) => {
        const key = keyOf(table);
        if (opts.failOn === key) {
          throw new Error(`connection terminated for table ${key}`);
        }
        const rows = rowsFor(table);
        const thenable = Promise.resolve(rows) as PromiseLike<Row[]> & {
          where: (cond: unknown) => PromiseLike<Row[]>;
        };
        thenable.where = () => {
          queried.push({ key, whereUsed: true });
          return Promise.resolve(rows);
        };
        queried.push({ key, whereUsed: false });
        return thenable;
      },
    }),
    insert: (table: unknown) => ({
      values: (values: Row[]) => ({
        onConflictDoNothing: () => {
          inserted.push({ key: keyOf(table), rows: values, conflictMode: 'doNothing' });
          return Promise.resolve([]);
        },
      }),
    }),
  } as unknown as DbType;

  return { db, queried, inserted };
}

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'hw-backup-test-'));
}

describe('table registry', () => {
  it('covers every schema table exactly once (31 tables)', () => {
    const keys = TABLE_REGISTRY.map((ref) => ref.key);
    expect(keys.length).toBe(31);
    expect(new Set(keys).size).toBe(31);
    for (const ref of TABLE_REGISTRY) {
      expect(ref.table, `table object missing for ${ref.key}`).toBeTruthy();
    }
  });

  it('is ordered parents-first (children come after everything they reference)', () => {
    const idx = (key: string): number => TABLES_PARENTS_FIRST.findIndex((ref) => ref.key === key);
    expect(idx('users')).toBeLessThan(idx('listings'));
    expect(idx('users')).toBeLessThan(idx('media'));
    expect(idx('users')).toBeLessThan(idx('transactions'));
    expect(idx('listings')).toBeLessThan(idx('media'));
    expect(idx('transactions')).toBeLessThan(idx('transactionDocuments'));
    expect(idx('transactions')).toBeLessThan(idx('signatureRequests'));
    expect(idx('transactions')).toBeLessThan(idx('paymentRecords'));
    expect(idx('conversations')).toBeLessThan(idx('messages'));
    expect(idx('clients')).toBeLessThan(idx('notes'));
    expect(idx('clients')).toBeLessThan(idx('ratings'));
    expect(idx('referrals')).toBeLessThan(idx('commissions'));
    expect(idx('subscriptionPlans')).toBeLessThan(idx('subscriptions'));
    expect(idx('activityRules')).toBeLessThan(idx('agentActivities'));
  });

  it('children-first order is the exact reverse (for FK-safe deletes)', () => {
    expect(TABLES_CHILDREN_FIRST.map((r) => r.key)).toEqual(
      [...TABLES_PARENTS_FIRST].reverse().map((r) => r.key),
    );
  });

  it('gives every table a seed-scope predicate so seed backups are precise', () => {
    // All 31 tables must declare a seedWhere — seed-scope backups capture
    // exactly what revert deletes; no table may silently fall back to "all rows".
    for (const ref of TABLE_REGISTRY) {
      expect(ref.seedWhere, `seedWhere missing for ${ref.key}`).toBeTruthy();
    }
  });
});

describe('collectBackup', () => {
  it('captures all rows of all tables for full scope', async () => {
    const { db, queried } = createFakeDb({
      rows: {
        users: [{ id: 'u1' }, { id: 'u2' }],
        media: [{ id: 'm1' }],
      },
    });
    const backup = await collectBackup(db, 'full');
    expect(backup.meta.scope).toBe('full');
    expect(backup.meta.version).toBe(BACKUP_FORMAT_VERSION);
    expect(backup.meta.counts.users).toBe(2);
    expect(backup.meta.counts.media).toBe(1);
    expect(backup.meta.totalRows).toBe(3);
    expect(backup.tables.users).toEqual([{ id: 'u1' }, { id: 'u2' }]);
    // every registry table queried in full scope
    expect(queried.length).toBe(TABLE_REGISTRY.length);
    expect(queried.every((q) => !q.whereUsed)).toBe(true);
  });

  it('uses the seed predicate (where) for seed scope — never full-table scans', async () => {
    const { db, queried } = createFakeDb({
      rows: { users: [{ id: 'seed-user-admin-0001' }] },
    });
    const backup = await collectBackup(db, 'seed');
    expect(backup.meta.scope).toBe('seed');
    expect(backup.meta.counts.users).toBe(1);
    // Every queried table went through .where() with the seed predicate
    expect(queried.filter((q) => q.whereUsed).length).toBe(TABLE_REGISTRY.length);
  });

  it('never leaks credentials into meta (host only, port kept for provenance)', async () => {
    process.env.DATABASE_URL = 'postgresql://postgres:super-secret@db.example.com:5432/postgres';
    try {
      const { db } = createFakeDb();
      const backup = await collectBackup(db, 'full');
      // URL.host keeps the port (5432 direct vs 6543 pooler is useful provenance)
      expect(backup.meta.dbHost).toBe('db.example.com:5432');
      expect(JSON.stringify(backup.meta)).not.toContain('super-secret');
      expect(JSON.stringify(backup.meta)).not.toContain('postgres:');
    } finally {
      delete process.env.DATABASE_URL;
    }
  });

  it('fails HARD (throws, aborting the destructive op) when a table cannot be read', async () => {
    const { db } = createFakeDb({ failOn: 'users' });
    await expect(collectBackup(db, 'full')).rejects.toThrow(
      /Backup failed for table "users" — aborting, nothing was deleted/,
    );
  });
});

describe('writeBackupFile / createBackup', () => {
  it('writes a parseable, versioned file whose name encodes the scope', async () => {
    const dir = tmpDir();
    const { db } = createFakeDb({ rows: { users: [{ id: 'u1' }] } });
    const { file, path: written } = await createBackup(db, 'seed', dir);
    try {
      expect(written.startsWith(dir)).toBe(true);
      expect(path.basename(written)).toContain('backup-seed-');
      const parsed = JSON.parse(fs.readFileSync(written, 'utf8')) as SeedBackupFile;
      expect(parsed.meta.version).toBe(BACKUP_FORMAT_VERSION);
      expect(parsed.meta.scope).toBe('seed');
      expect(parsed.tables.users).toEqual([{ id: 'u1' }]);
      expect(file.meta.totalRows).toBe(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('leaves no .tmp file behind', () => {
    const dir = tmpDir();
    try {
      const file: SeedBackupFile = {
        meta: { version: BACKUP_FORMAT_VERSION, scope: 'full', createdAt: new Date().toISOString(), dbHost: 'x', counts: {}, totalRows: 0 },
        tables: {},
      };
      writeBackupFile(file, dir);
      expect(fs.readdirSync(dir).filter((f) => f.endsWith('.tmp'))).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('restoreBackup', () => {
  function seedBackupFile(dir: string, tables: RowMap): string {
    const file: SeedBackupFile = {
      meta: { version: BACKUP_FORMAT_VERSION, scope: 'full', createdAt: new Date().toISOString(), dbHost: 'x', counts: {}, totalRows: 0 },
      tables,
    };
    const p = path.join(dir, 'backup-full-test.json');
    fs.writeFileSync(p, JSON.stringify(file), 'utf8');
    return p;
  }

  it('inserts parents before children and reports restored counts', async () => {
    const dir = tmpDir();
    const file = seedBackupFile(dir, {
      users: [{ id: 'u1' }],
      listings: [{ id: 'l1' }],
      media: [{ id: 'm1' }],
    });
    const { db, inserted } = createFakeDb();
    try {
      const { restored } = await restoreBackup(db, file);
      expect(inserted.map((i) => i.key)).toEqual(['users', 'listings', 'media']);
      expect(restored).toEqual({ users: 1, listings: 1, media: 1 });
      // restore must never overwrite existing rows
      expect(inserted.every((i) => i.conflictMode === 'doNothing')).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('chunks large inserts to stay under the Postgres bind-parameter limit', async () => {
    const dir = tmpDir();
    const bigRows: Row[] = Array.from({ length: 450 }, (_, i) => ({ id: `u${i}` }));
    const file = seedBackupFile(dir, { users: bigRows });
    const { db, inserted } = createFakeDb();
    try {
      const { restored } = await restoreBackup(db, file);
      const userInserts = inserted.filter((i) => i.key === 'users');
      expect(userInserts.length).toBe(3); // 200 + 200 + 50
      expect(userInserts.reduce((a, i) => a + i.rows.length, 0)).toBe(450);
      expect(restored.users).toBe(450);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ignores unknown table keys in the file (forward-compat)', async () => {
    const dir = tmpDir();
    const file = seedBackupFile(dir, { users: [{ id: 'u1' }], futureTable: [{ id: 'x' }] });
    const { db, inserted } = createFakeDb();
    try {
      const { restored } = await restoreBackup(db, file);
      expect(Object.keys(restored)).toEqual(['users']);
      expect(inserted.map((i) => i.key)).toEqual(['users']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects missing files, invalid JSON, and wrong format versions', async () => {
    const dir = tmpDir();
    const { db } = createFakeDb();
    try {
      await expect(restoreBackup(db, path.join(dir, 'nope.json'))).rejects.toThrow(/not found/);
      const badJson = path.join(dir, 'bad.json');
      fs.writeFileSync(badJson, '{nope', 'utf8');
      await expect(restoreBackup(db, badJson)).rejects.toThrow(/not valid JSON/);
      const badVersion = path.join(dir, 'old.json');
      fs.writeFileSync(badVersion, JSON.stringify({ meta: { version: 0 }, tables: {} }), 'utf8');
      await expect(restoreBackup(db, badVersion)).rejects.toThrow(/Unrecognized backup format/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
