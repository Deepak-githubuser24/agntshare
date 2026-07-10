/**
 * AgentShare Demo: Full Upload → Token → Resolve Flow
 *
 * Run: npx tsx examples/full-flow.ts
 *
 * Requires: Local AgentShare server running on http://localhost:3000
 */

import { AgentShare } from "../packages/sdk-ts/src";

async function main() {
  const client = new AgentShare({
    apiKey: "demo-user",
    baseUrl: "http://localhost:3000/api",
  });

  // ── Step 1: Upload ─────────────────────────────────────
  console.log("\n┌─ Upload ────────────────────────────────────");
  const content = JSON.stringify({
    agent: "research-bot",
    task: "quarterly-report",
    findings: [
      { topic: "Revenue", value: "$4.2M", delta: "+18%" },
      { topic: "Users", value: "12,400", delta: "+31%" },
      { topic: "Churn", value: "2.1%", delta: "-0.4%" },
    ],
    generatedAt: new Date().toISOString(),
  }, null, 2);

  const { uploadUrl, assetId } = await client.upload({
    filename: "quarterly-report.json",
    contentType: "application/json",
    sizeBytes: Buffer.byteLength(content),
  });

  const s3Res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: content,
  });

  if (!s3Res.ok) throw new Error(`Storage upload failed: ${s3Res.status}`);
  console.log(`│  Asset ID: ${assetId}`);
  console.log(`│  Size: ${Buffer.byteLength(content)} bytes`);
  console.log("└─────────────────────────────────────────────\n");

  // ── Step 2: Mint Token ─────────────────────────────────
  console.log("┌─ Mint Token ────────────────────────────────");
  const { token, shareUrl } = await client.mintToken({
    assetId,
    scope: "read",
  });
  console.log(`│  Token: ${token}`);
  console.log(`│  Share URL: ${shareUrl}`);
  console.log("└─────────────────────────────────────────────\n");

  // ── Step 3: Resolve ────────────────────────────────────
  console.log("┌─ Resolve ───────────────────────────────────");
  const resolved = await client.resolve(token);
  console.log(`│  Filename: ${resolved.filename}`);
  console.log(`│  Content-Type: ${resolved.contentType}`);
  console.log(`│  Stream URL: ${resolved.streamUrl.substring(0, 60)}...`);
  console.log("└─────────────────────────────────────────────\n");

  // ── Step 4: Stream ─────────────────────────────────────
  console.log("┌─ Stream ────────────────────────────────────");
  const streamRes = await fetch(resolved.streamUrl);
  const data = await streamRes.json();
  console.log(`│  Received ${JSON.stringify(data).length} bytes`);
  console.log(`│  Agent: ${data.agent}`);
  console.log(`│  Findings: ${data.findings.length} items`);
  console.log("└─────────────────────────────────────────────\n");

  console.log("✓ Full flow complete: upload → token → resolve → stream");
}

main().catch(console.error);
