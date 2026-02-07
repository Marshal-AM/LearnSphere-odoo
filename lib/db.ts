import { Pool, types } from 'pg';

// PostgreSQL returns custom enum arrays (e.g. user_role[]) as raw strings
// like "{admin,learner}" instead of JS arrays. Override the default array
// parser for OID 1009 (text[]) — but the safest fix is to handle it
// in a row-transform helper so every query benefits automatically.

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'learnsphere',
  user: process.env.PGUSER || undefined,
  password: process.env.PGPASSWORD || undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;

/**
 * Parse a PostgreSQL text-encoded array like "{admin,learner}" into a JS array.
 * Returns the value as-is if it's already an array.
 */
function parsePgArray(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    const inner = value.slice(1, -1);
    if (inner.length === 0) return [];
    return inner.split(',').map(s => s.replace(/^"|"$/g, ''));
  }
  return [];
}

/**
 * Walk each row returned from PG and normalise any field whose value looks
 * like a PostgreSQL array literal (e.g. "{admin,learner}") into a real JS array.
 * This covers enum array columns like `roles user_role[]` that the pg driver
 * doesn't auto-parse.
 */
function normaliseRow<T>(row: Record<string, unknown>): T {
  for (const key of Object.keys(row)) {
    const v = row[key];
    if (typeof v === 'string' && v.startsWith('{') && v.endsWith('}') && !v.startsWith('{"')) {
      // Looks like a simple PG array literal — convert to JS array
      row[key] = parsePgArray(v);
    }
  }
  return row as T;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows.map(row => normaliseRow<T>(row));
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await pool.query(text, params);
  if (!result.rows[0]) return null;
  return normaliseRow<T>(result.rows[0]);
}
