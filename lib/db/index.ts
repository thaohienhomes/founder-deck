import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

declare global {
  var __fdPool: Pool | undefined;
}

export const DB_CONFIGURED = Boolean(process.env.DATABASE_URL);

/**
 * Lazy on purpose: a missing DATABASE_URL must not blow up at import time,
 * or `next build` fails before the app ever gets a chance to render the
 * "finish your setup" screen.
 */
function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  if (!global.__fdPool) global.__fdPool = new Pool({ connectionString });
  return global.__fdPool;
}

type DB = ReturnType<typeof drizzle<typeof schema>>;
let _db: DB | null = null;

function client(): DB {
  if (!_db) _db = drizzle(getPool(), { schema });
  return _db;
}

/** `db` proxies to the real client on first property access. */
function lazyProxy<T extends object>(resolve: () => T): T {
  return new Proxy({} as T, {
    get(_t, prop) {
      const target = resolve() as Record<string | symbol, unknown>;
      const value = target[prop];
      // bind methods so `this` is the real client, not the proxy
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export const db = lazyProxy<DB>(client);
export const pool = lazyProxy<Pool>(getPool);

export * from "./schema";

/**
 * `db.execute` returns a driver-specific shape (an array on some drivers, a
 * QueryResult with `.rows` on neon-serverless). Normalise once, here.
 */
export function asRows<T = Record<string, unknown>>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  const r = result as { rows?: unknown };
  return (Array.isArray(r?.rows) ? r.rows : []) as T[];
}
