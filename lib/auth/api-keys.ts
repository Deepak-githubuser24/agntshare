import { createHash, randomBytes } from "crypto";
import { query } from "@/lib/db/client";

/**
 * Generate a new API key. Returns the raw key (show once to the user)
 * and the SHA-256 hash (store in the database).
 */
export function generateApiKey(): { rawKey: string; keyHash: string } {
  const rawKey = `as_${randomBytes(32).toString("hex")}`;
  const keyHash = hashApiKey(rawKey);
  return { rawKey, keyHash };
}

/**
 * Deterministic SHA-256 hash of a raw API key string.
 */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

type ApiKeyRow = {
  id: string;
  user_id: string;
  revoked_at: string | null;
};

/**
 * Look up a Bearer token, return the owning user_id if the key is
 * valid (exists and not revoked). Returns null otherwise.
 */
export async function verifyApiKey(rawKey: string): Promise<string | null> {
  const keyHash = hashApiKey(rawKey);
  const rows = await query<ApiKeyRow>(
    `SELECT id, user_id, revoked_at FROM api_keys WHERE key_hash = $1`,
    [keyHash]
  );
  if (rows.length === 0) return null;
  if (rows[0].revoked_at) return null;
  return rows[0].user_id;
}

/**
 * Persist a new API key for a user. Returns the row id.
 */
export async function storeApiKey(
  userId: string,
  keyHash: string,
  label?: string
): Promise<string> {
  const [row] = await query<{ id: string }>(
    `INSERT INTO api_keys (user_id, key_hash, label) VALUES ($1, $2, $3) RETURNING id`,
    [userId, keyHash, label ?? null]
  );
  return row.id;
}
