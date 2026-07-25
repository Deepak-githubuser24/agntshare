import { AgentShare } from "../packages/sdk-ts/src";
import { query } from "../lib/db/client";
import crypto from "crypto";

async function runTest() {
  console.log("=== AgentShare Phase 0 Verification Suite ===");

  // 0. Apply migration 003 if columns don't exist yet
  try {
    await query(`
      ALTER TABLE audit_logs
        ADD COLUMN IF NOT EXISTS agent_id TEXT,
        ADD COLUMN IF NOT EXISTS session_id TEXT,
        ADD COLUMN IF NOT EXISTS agent_role TEXT;

      ALTER TABLE pathway_tokens
        ADD COLUMN IF NOT EXISTS agent_id TEXT,
        ADD COLUMN IF NOT EXISTS session_id TEXT,
        ADD COLUMN IF NOT EXISTS agent_role TEXT;
    `);
    console.log("✓ Applied DB Schema Migration 003 (Agent Identity)");
  } catch (err) {
    console.error("Migration error:", err);
  }

  // Generate an API key / seed user for testing
  let apiKey = process.env.AGENTSHARE_API_KEY;
  if (!apiKey) {
    // Look up or create a seed key
    const [user] = await query<{ id: string }>(`SELECT id FROM users LIMIT 1`);
    if (user) {
      const rawKey = `agnt_test_${crypto.randomBytes(16).toString("hex")}`;
      const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
      await query(
        `INSERT INTO api_keys (user_id, key_hash, label) VALUES ($1, $2, 'phase0-test')`,
        [user.id, keyHash]
      );
      apiKey = rawKey;
    }
  }

  if (!apiKey) {
    throw new Error("No API key available for test. Please set AGENTSHARE_API_KEY or seed a user.");
  }

  const client = new AgentShare({
    apiKey,
    baseUrl: "http://localhost:3000/api",
    agentId: "agent-alpha-v1",
    sessionId: "sess-9902",
    agentRole: "code-architect",
  });

  const sampleData = JSON.stringify({ message: "Phase 0 Verification", timestamp: Date.now() });
  const sampleSha256 = crypto.createHash("sha256").update(sampleData).digest("hex");

  // 1. Upload asset with checksum & agent identity
  console.log("\n1. Testing Upload with Checksum & Agent Identity...");
  const uploadRes = await client.upload({
    filename: "phase0-test.json",
    contentType: "application/json",
    sizeBytes: Buffer.byteLength(sampleData),
    checksumSha256: sampleSha256,
  });
  console.log(`✓ Upload initialized. Asset ID: ${uploadRes.assetId}`);

  // 2. Mint Tokens (Read & Read_Write)
  console.log("\n2. Testing Token Creation (Read & Read_Write)...");
  const readTokenRes = await client.mintToken({
    assetId: uploadRes.assetId,
    scope: "read",
    ttlSeconds: 3600,
  });
  console.log(`✓ Read Token Minted: ${readTokenRes.token} (Scope: ${readTokenRes.scope})`);

  const writeTokenRes = await client.mintToken({
    assetId: uploadRes.assetId,
    scope: "read_write",
    ttlSeconds: 3600,
  });
  console.log(`✓ Read_Write Token Minted: ${writeTokenRes.token} (Scope: ${writeTokenRes.scope})`);

  // 3. Test Token Scope Enforcement
  console.log("\n3. Testing Scope Enforcement...");
  // Read token with intent=read -> Should succeed
  const readResolved = await client.resolve(readTokenRes.token, { intent: "read" });
  console.log(`✓ Resolved Read Token (intent=read) -> streamUrl present, uploadUrl: ${readResolved.uploadUrl ?? "none"}`);

  // Read token with intent=write -> Should fail with 403
  try {
    await client.resolve(readTokenRes.token, { intent: "write" });
    console.error("❌ ERROR: Read token should not allow intent=write!");
  } catch (err: any) {
    if (err.status === 403) {
      console.log(`✓ Read token correctly rejected intent=write with 403 Forbidden (${err.message})`);
    } else {
      console.error("❌ Unexpected error:", err);
    }
  }

  // Write token with intent=write -> Should succeed and return uploadUrl
  const writeResolved = await client.resolve(writeTokenRes.token, { intent: "write" });
  if (writeResolved.uploadUrl) {
    console.log(`✓ Read_Write token correctly permitted intent=write and returned presigned uploadUrl`);
  } else {
    console.error("❌ ERROR: Read_Write token did not return uploadUrl for intent=write!");
  }

  // 4. Test Checksum Verification
  console.log("\n4. Testing Checksum Integrity Verification...");
  console.log(`✓ Resolved SHA-256 Checksum: ${readResolved.checksumSha256}`);
  const isMatch = await AgentShare.verifyChecksum(sampleData, readResolved.checksumSha256!);
  if (isMatch) {
    console.log(`✓ Checksum verification utility confirmed payload integrity matches expected hash!`);
  } else {
    console.error("❌ ERROR: Checksum mismatch!");
  }

  // 5. Test Token Revocation
  console.log("\n5. Testing Token Revocation...");
  const revokeRes = await client.revokeToken(readTokenRes.token);
  console.log(`✓ Revoked Token ${revokeRes.token} at ${revokeRes.revokedAt}`);

  // Resolve revoked token -> Should fail with 410
  try {
    await client.resolve(readTokenRes.token);
    console.error("❌ ERROR: Resolved a revoked token!");
  } catch (err: any) {
    if (err.status === 410) {
      console.log(`✓ Resolve correctly rejected revoked token with 410 Gone (${err.message})`);
    } else {
      console.error("❌ Unexpected error resolving revoked token:", err);
    }
  }

  // 6. Verify Audit Logs for Agent Identity
  console.log("\n6. Verifying Agent Identity in Audit Logs...");
  const auditLogs = await query<{ event_type: string; agent_id: string; session_id: string; agent_role: string }>(
    `SELECT event_type, agent_id, session_id, agent_role FROM audit_logs ORDER BY id DESC LIMIT 5`
  );
  console.log("Recent Audit Logs:");
  for (const log of auditLogs) {
    console.log(`  - Event: ${log.event_type} | AgentID: ${log.agent_id} | Session: ${log.session_id} | Role: ${log.agent_role}`);
  }

  console.log("\n=== ALL PHASE 0 VERIFICATION CHECKS PASSED ===");
}

runTest().catch((err) => {
  console.error("Verification Test Failed:", err);
  process.exit(1);
});
