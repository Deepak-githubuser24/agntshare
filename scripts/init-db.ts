import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { query } from "../lib/db/client";
import fs from "fs";
import path from "path";
import crypto from "crypto";

async function initDb() {
  console.log("=== AgentShare Database Initialization ===");
  console.log(`Connecting to database at: ${process.env.DATABASE_URL ? "URL loaded from environment" : "DEFAULT (localhost:5432)"}`);

  if (!process.env.DATABASE_URL) {
    console.log("\n⚠️  DATABASE_URL IS NOT SET IN .env.local");
    console.log("   Please add your Neon PostgreSQL connection string to D:\\agentshare\\.env.local:\n");
    console.log('   DATABASE_URL="postgresql://user:pass@ep-cool-cloud.neon.tech/agentshare?sslmode=require"\n');
    process.exit(1);
  }

  try {
    // 1. Run schema.sql
    const schemaSqlPath = path.join(process.cwd(), "lib", "db", "schema.sql");
    const schemaSql = fs.readFileSync(schemaSqlPath, "utf-8");
    await query(schemaSql);
    console.log("✓ Applied base schema (lib/db/schema.sql)");

    // 2. Run migrate-003-agent-identity.sql
    const migrateSqlPath = path.join(process.cwd(), "lib", "db", "migrate-003-agent-identity.sql");
    if (fs.existsSync(migrateSqlPath)) {
      const migrateSql = fs.readFileSync(migrateSqlPath, "utf-8");
      await query(migrateSql).catch(() => null); // Columns may already exist
      console.log("✓ Applied agent identity migration (lib/db/migrate-003-agent-identity.sql)");
    }

    // 3. Seed test user & test API key
    const testUserId = "00000000-0000-0000-0000-000000000000";
    await query(
      `INSERT INTO users (id, name, email) 
       VALUES ($1, 'Test Developer', 'test@agentshare.dev')
       ON CONFLICT (id) DO NOTHING`,
      [testUserId]
    );

    const testApiKey = "as_e2etestkey_for_local_development_only_do_not_use_in_prod";
    const testKeyHash = crypto.createHash("sha256").update(testApiKey).digest("hex");

    await query(
      `INSERT INTO api_keys (user_id, key_hash, label)
       VALUES ($1, $2, 'Local Test Key')
       ON CONFLICT DO NOTHING`,
      [testUserId, testKeyHash]
    );

    console.log("\n===================================================================");
    console.log(" ✓ DATABASE INITIALIZATION COMPLETE!");
    console.log(" ✓ Seeded Test API Key: as_e2etestkey_for_local_development_only_do_not_use_in_prod");
    console.log("===================================================================\n");
  } catch (err: any) {
    console.error("❌ Database Initialization Failed:", err.message || err);
    process.exit(1);
  }
}

initDb();
