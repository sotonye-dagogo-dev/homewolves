import { vi } from 'vitest';
import type { DrizzleService } from '../drizzle/drizzle.service';

type MockFn = ReturnType<typeof vi.fn>;

export type Chainable<T> = PromiseLike<T> & {
  [key: string]: (...args: unknown[]) => Chainable<T>;
};

/**
 * Builds a thenable query-builder chain. Every chain method (from, where,
 * orderBy, limit, offset, set, values, returning, onConflictDoUpdate, ...)
 * returns the same chainable so it can be awaited like a Drizzle query.
 * The optional `onMethod` callback records every method invocation.
 */
export function createChain<T>(value: T | PromiseLike<T>, onMethod?: (method: string, args: unknown[]) => void): Chainable<T> {
  const promise = Promise.resolve(value);
  return new Proxy({} as Record<string | symbol, unknown>, {
    get(_target, prop) {
      if (prop === 'then') return promise.then.bind(promise);
      if (prop === 'catch') return promise.catch.bind(promise);
      if (prop === 'finally') return promise.finally.bind(promise);
      if (typeof prop === 'string') {
        return (...args: unknown[]) => {
          onMethod?.(prop, args);
          return createChain(value, onMethod);
        };
      }
      return undefined;
    },
  }) as unknown as Chainable<T>;
}

export interface TableQueryMocks {
  findMany: MockFn;
  findFirst: MockFn;
  findUnique: MockFn;
}

export interface DrizzleMock {
  db: DrizzleService;
  select: MockFn;
  insert: MockFn;
  update: MockFn;
  delete: MockFn;
  query: Record<string, TableQueryMocks>;
  table: (name: string) => TableQueryMocks;
}

/** Builds a DrizzleService mock with chainable select/insert/update/delete and the relational query API. */
export function createDrizzleMock(): DrizzleMock {
  const select = vi.fn(() => createChain([]));
  const insert = vi.fn(() => createChain([]));
  const update = vi.fn(() => createChain([]));
  const remove = vi.fn(() => createChain([]));
  const query: Record<string, TableQueryMocks> = {};

  const table = (name: string): TableQueryMocks => {
    if (!query[name]) {
      query[name] = {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
      };
    }
    return query[name]!;
  };

  const execute = vi.fn().mockResolvedValue([]);
  const db = {
    select,
    insert,
    update,
    delete: remove,
    execute,
    query,
  } as unknown as DrizzleService;

  return { db, select, insert, update, delete: remove, execute, query, table } as unknown as DrizzleMock & { execute: MockFn };
}
