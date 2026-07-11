/**
 * Seed an E2E test API key into the database.
 *
 * This script:
 * 1. Ensures a test user exists.
 * 2. Generates an API key with a known raw value for E2E tests.
 * 3. Stores the SHA-256 hash in the api_keys table.
 * 4. Writes the raw key to stdout so run_all.bat can set it as an env var.
 */

import { createHash } from "crypto";
import { Pool } from "pg";

const RAW_KEY = "as_e2etestkey_for_local_development_only_do_not_use_in_prod";

async function main() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5432/agentshare",
  });

  try {
    // Ensure test user exists
    await pool.query(
      `INSERT INTO users (id, email, password_hash, auth_provider)
       VALUES ('00000000-0000-0000-0000-000000000001', 'e2e@test.local', NULL, 'api_key')
       ON CONFLICT (email) DO NOTHING`
    );

    // Compute SHA-256 hash
    const keyHash = createHash("sha256").update(RAW_KEY).digest("hex");

    // Delete any old E2E keys, insert fresh
    await pool.query(
      `DELETE FROM api_keys WHERE user_id = '00000000-0000-0000-0000-000000000001'`
    );
    await pool.query(
      `INSERT INTO api_keys (user_id, key_hash, label)
       VALUES ('00000000-0000-0000-0000-000000000001', $1, 'e2e-test')`,
      [keyHash]
    );

    console.log(`✓ E2E API key seeded.`);
    console.log(`  Raw key: ${RAW_KEY}`);
    console.log(`  Hash:    ${keyHash}`);
    console.log(`  User:    e2e@test.local (00000000-0000-0000-0000-000000000001)`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("✗ Seed failed:", err.message);
  process.exit(1);
});
