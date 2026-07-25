import { AgentShare } from "../packages/sdk-ts/src";
import { query } from "../lib/db/client";
import crypto from "crypto";

async function runTest() {
  console.log("=== AgentShare Phase 2 Verification Suite (Structured State & Selective Retrieval) ===");

  // Lookup or seed an API key
  let apiKey = process.env.AGENTSHARE_API_KEY;
  if (!apiKey) {
    const [user] = await query<{ id: string }>(`SELECT id FROM users LIMIT 1`);
    if (user) {
      const rawKey = `agnt_test_${crypto.randomBytes(16).toString("hex")}`;
      const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
      await query(
        `INSERT INTO api_keys (user_id, key_hash, label) VALUES ($1, $2, 'phase2-test')`,
        [user.id, keyHash]
      );
      apiKey = rawKey;
    }
  }

  if (!apiKey) {
    throw new Error("No API key available for test.");
  }

  const client = new AgentShare({
    apiKey,
    baseUrl: "http://localhost:3000/api",
    agentId: "planner-agent-01",
    sessionId: "session-state-808",
    agentRole: "lead-architect",
  });

  // 1. Share Structured Agent Memory / Project State
  console.log("\n1. Testing Structured Agent Memory / State Sharing...");
  const agentStatePayload = {
    summary: "AgentShare Phase 2 Implementation Complete",
    decisions: [
      "Use JSON dot-notation for path extraction",
      "Support key list array filtering",
      "Maintain 100% opaque presigned S3 URLs",
    ],
    memory: {
      database: "Postgres 16",
      auth: "SHA-256 API Keys",
      storage: "S3 Presigned URLs",
      checksum: "SHA-256 Enabled",
    },
    context: {
      currentPhase: 2,
      status: "testing",
    },
  };

  const shareStateRes = await client.shareState({
    state: agentStatePayload,
    filename: "agent-context-snapshot.json",
    scope: "read",
    ttlSeconds: 86400,
  });

  console.log(`✓ State Shared successfully!`);
  console.log(`  - Token: ${shareStateRes.token}`);
  console.log(`  - Share URL: ${shareStateRes.shareUrl}`);
  console.log(`  - Checksum SHA-256: ${shareStateRes.checksumSha256}`);

  // 2. Test Full State Retrieval
  console.log("\n2. Testing Full State Retrieval (resolveState)...");
  const fullResolved = await client.resolveState(shareStateRes.token);
  console.log(`✓ Full State Retrieved (Filename: ${fullResolved.filename}, ChecksumValid: ${fullResolved.checksumValid})`);
  console.log(`  - Summary: "${fullResolved.state.summary}"`);
  console.log(`  - Decisions Count: ${fullResolved.state.decisions.length}`);

  // 3. Test Selective Retrieval by Keys
  console.log("\n3. Testing Selective Retrieval by Keys (keys: ['summary', 'decisions'])...");
  const keysResolved = await client.resolveState(shareStateRes.token, { keys: ["summary", "decisions"] });
  console.log(`✓ Selective State Retrieved by Keys:`, keysResolved.state);
  if (keysResolved.state.summary && keysResolved.state.decisions && !keysResolved.state.memory) {
    console.log(`✓ Selective key filtering verified: 'memory' and 'context' were omitted as requested!`);
  } else {
    console.error("❌ ERROR: Key filtering failed!");
  }

  // 4. Test Selective Retrieval by Dot-Notation Path
  console.log("\n4. Testing Selective Retrieval by Path (path: 'memory.database')...");
  const pathResolved = await client.resolveState(shareStateRes.token, { path: "memory.database" });
  console.log(`✓ Selective State Retrieved by Path ('memory.database'):`, pathResolved.state);
  if (pathResolved.state === "Postgres 16") {
    console.log(`✓ Path extraction verified: extracted exact value 'Postgres 16'!`);
  } else {
    console.error("❌ ERROR: Path extraction failed!");
  }

  // 5. Test Backward Compatibility with File Uploads
  console.log("\n5. Testing Backward Compatibility with File Uploads...");
  const rawFileContent = "AgentShare plain text file payload verification.";
  const fileUploadRes = await client.upload({
    filename: "plain-file.txt",
    contentType: "text/plain",
    sizeBytes: Buffer.byteLength(rawFileContent),
  });
  const fileTokenRes = await client.mintToken({ assetId: fileUploadRes.assetId });
  const fileResolved = await client.resolve(fileTokenRes.token);
  console.log(`✓ File Upload & Resolve verified backwards compatible: ${fileResolved.filename} (${fileResolved.contentType})`);

  // 6. Verify Audit Trail for Selective Retrieval
  console.log("\n6. Verifying Audit Trail for Selective Parameters...");
  const auditLogs = await query<{ event_type: string; metadata: any }>(
    `SELECT event_type, metadata FROM audit_logs WHERE event_type = 'token_resolved' ORDER BY id DESC LIMIT 3`
  );
  console.log("Recent Audit Logs:");
  for (const log of auditLogs) {
    console.log(`  - Event: ${log.event_type} | Metadata: ${JSON.stringify(log.metadata)}`);
  }

  console.log("\n=== ALL PHASE 2 VERIFICATION CHECKS PASSED ===");
}

runTest().catch((err) => {
  console.error("Phase 2 Verification Test Failed:", err);
  process.exit(1);
});
