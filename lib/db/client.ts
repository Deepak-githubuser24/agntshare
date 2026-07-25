import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function sanitizeConnectionString(url?: string): string | undefined {
  if (!url) return undefined;
  // Trim whitespace, quotes, and non-printable control characters
  let clean = url.trim().replace(/^["']|["']$/g, "").trim();
  clean = clean.replace(/[\u0000-\u001F\u007F-\u009F\uFFFD]/g, "");
  return clean;
}

export function getPool(): Pool {
  if (!global._pgPool) {
    const connectionString = sanitizeConnectionString(process.env.DATABASE_URL);
    const isSSL = connectionString?.includes("neon.tech") || connectionString?.includes("sslmode=require");
    
    global._pgPool = new Pool({
      connectionString: connectionString || undefined,
      ssl: isSSL ? { rejectUnauthorized: false } : undefined,
    });
  }
  return global._pgPool;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}
