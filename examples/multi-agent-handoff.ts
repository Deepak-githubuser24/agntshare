/**
 * AgentShare Real-World Example: Multi-Agent Handoff & Selective Retrieval
 *
 * Demonstrates a complete 3-agent pipeline using AgentShare:
 *   1. Agent A (Planner): Shares a structured project state snapshot (summary, decisions, memory).
 *   2. Agent B (Coder): Resolves token with SELECTIVE RETRIEVAL (`keys: ["summary", "decisions"]`) to save prompt tokens.
 *   3. Agent C (Security Audit): Verifies SHA-256 checksum, audits identity, and revokes token after handoff.
 *
 * Run: npx tsx examples/multi-agent-handoff.ts
 */

import { AgentShare } from "../packages/sdk-ts/src";

async function runMultiAgentHandoff() {
  console.log("===================================================================");
  console.log("  AgentShare Multi-Agent Handoff & Selective Retrieval Demonstration ");
  console.log("===================================================================\n");

  const apiKey = process.env.AGENTSHARE_API_KEY ?? "as_e2etestkey_for_local_development_only_do_not_use_in_prod";
  
  // Cleanly normalize baseUrl without duplicating /api
  let baseUrl = process.env.AGENTSHARE_BASE_URL ?? "http://127.0.0.1:3000/api";
  if (!baseUrl.endsWith("/api")) {
    baseUrl = `${baseUrl.replace(/\/+$/, "")}/api`;
  }

  // Pre-check server availability (with 10s timeout to allow Next.js route compilation)
  try {
    const rootUrl = baseUrl.replace(/\/api\/?$/, "");
    const healthUrl = `${rootUrl}/api/health`;
    const healthRes = await fetch(healthUrl, { signal: AbortSignal.timeout(10000) }).catch(() => null);
    if (!healthRes || !healthRes.ok) {
      // Fallback try localhost
      const altUrl = healthUrl.replace("127.0.0.1", "localhost");
      const altRes = await fetch(altUrl, { signal: AbortSignal.timeout(5000) }).catch(() => null);
      if (!altRes || !altRes.ok) {
        console.log("⚠️  COULD NOT CONNECT TO AGENTSHARE DEV SERVER");
        console.log(`   Attempted endpoint: ${healthUrl}`);
        console.log("   If 'npm run dev' is running, ensure it is listening on http://127.0.0.1:3000\n");
        console.log("===================================================================\n");
        return;
      }
    }
  } catch {
    // Continue
  }

  // ── Step 1: Agent A (Planner) Shares Project State ─────────────────────────
  console.log("🤖 [Agent A - Architecture Planner]");
  const plannerClient = new AgentShare({
    apiKey,
    baseUrl,
    agentId: "agent-planner-v1",
    sessionId: "handoff-session-404",
    agentRole: "architect",
  });

  const projectState = {
    summary: "Refactored user billing pipeline to async event queue",
    decisions: [
      "Decouple Stripe webhook processing from HTTP request cycle",
      "Store idempotency keys in Redis with 24h TTL",
      "Log audit events to PostgreSQL audit_logs table",
    ],
    memory: {
      dbEngine: "PostgreSQL 16",
      cacheEngine: "Redis 7.2",
      queueProvider: "SQS",
      retryLimit: 3,
    },
    context: {
      sprintId: "sprint-88",
      assignedDevs: ["agent-coder-v2", "agent-reviewer-v1"],
    },
  };

  console.log("   Sharing structured project state...");
  const shareRes = await plannerClient.shareState({
    state: projectState,
    filename: "billing-refactor-state.json",
    scope: "read",
    ttlSeconds: 3600,
  });

  console.log(`   ✓ Pathway Token Minted: "${shareRes.token}"`);
  console.log(`   ✓ Share URL: ${shareRes.shareUrl}`);
  console.log(`   ✓ Checksum SHA-256: ${shareRes.checksumSha256}\n`);

  // ── Step 2: Agent B (Coder) Selectively Retrieves Context ─────────────────
  console.log("🤖 [Agent B - Code Generator]");
  const coderClient = new AgentShare({
    apiKey,
    baseUrl,
    agentId: "agent-coder-v2",
    sessionId: "handoff-session-404",
    agentRole: "developer",
  });

  console.log(`   Resolving token "${shareRes.token}" with SELECTIVE RETRIEVAL (keys: ['summary', 'decisions'])...`);
  const selectiveRes = await coderClient.resolveState(shareRes.token, {
    keys: ["summary", "decisions"],
  });

  console.log("   ✓ Selective Data Received (Skipped 'memory' & 'context' to save prompt tokens):");
  console.log("     Summary:", selectiveRes.state.summary);
  console.log("     Decisions:", selectiveRes.state.decisions);
  console.log("     (memory property present?):", "memory" in selectiveRes.state ? "YES" : "NO (Filtered out!)");
  console.log("");

  // ── Step 3: Agent B Queries Dot-Notation Path ──────────────────────────────
  console.log("   Extracting specific config path ('memory.dbEngine')...");
  const pathRes = await coderClient.resolveState(shareRes.token, {
    path: "memory.dbEngine",
  });
  console.log(`   ✓ Extracted Path Value: "${pathRes.state}"\n`);

  // ── Step 4: Agent C (Reviewer) Verifies & Revokes Token ────────────────────
  console.log("🤖 [Agent C - Security & Audit Reviewer]");
  const reviewerClient = new AgentShare({
    apiKey,
    baseUrl,
    agentId: "agent-reviewer-v1",
    sessionId: "handoff-session-404",
    agentRole: "auditor",
  });

  console.log(`   Resolving full state and verifying SHA-256 checksum integrity...`);
  const fullRes = await reviewerClient.resolveState(shareRes.token);
  console.log(`   ✓ Checksum Verified Valid: ${fullRes.checksumValid ? "YES (Match)" : "NO"}`);

  console.log(`   Revoking token "${shareRes.token}" to enforce least-privilege after handoff...`);
  const revokeRes = await reviewerClient.revokeToken(shareRes.token);
  console.log(`   ✓ Token permanently revoked at: ${revokeRes.revokedAt}\n`);

  console.log("===================================================================");
  console.log("  ✓ MULTI-AGENT HANDOFF SUCCESSFUL!");
  console.log("===================================================================\n");
}

runMultiAgentHandoff().catch((err) => {
  console.log("\n⚠️  AGENTSHARE ERROR:", err.message || err);
});
