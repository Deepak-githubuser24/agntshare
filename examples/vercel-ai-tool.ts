/**
 * AgentShare Demo: Vercel AI SDK Tool
 *
 * Shows how an LLM autonomously uses AgentShare to save artifacts
 * instead of returning large text blobs in the conversation.
 *
 * Run: npx tsx examples/vercel-ai-tool.ts
 */

import { AgentShare } from "../packages/sdk-ts/src";
import { createAgentShareTool } from "../packages/vercel-ai/src";

async function main() {
  const client = new AgentShare({
    apiKey: "demo-user",
    baseUrl: "http://localhost:3000/api",
  });

  const tool = createAgentShareTool(client);

  // Simulate what the LLM does when it calls the tool
  console.log("\n┌─ Simulating LLM Tool Call ───────────────────");
  console.log("│  Model decides to save a report via AgentShare");
  console.log("│  Action: share");
  console.log("│  Filename: analysis.json");
  console.log("└──────────────────────────────────────────────\n");

  const result = await tool.execute({
    action: "share" as const,
    filename: "analysis.json",
    content: JSON.stringify({
      sentiment: "positive",
      confidence: 0.94,
      summary: "Market conditions favorable for Q3 expansion.",
    }),
    contentType: "application/json",
  });

  console.log("┌─ Tool Result ────────────────────────────────");
  console.log(`│  ${JSON.stringify(result, null, 2).split("\n").join("\n│  ")}`);
  console.log("└──────────────────────────────────────────────\n");

  if (result && typeof result === "object" && "token" in result) {
    // Now simulate the resolve action
    console.log("┌─ Simulating Resolve ─────────────────────────");
    const resolveResult = await tool.execute({
      action: "resolve" as const,
      token: (result as { token: string }).token,
    });
    console.log(`│  ${JSON.stringify(resolveResult, null, 2).split("\n").join("\n│  ")}`);
    console.log("└──────────────────────────────────────────────\n");
  }

  console.log("✓ Vercel AI SDK tool demo complete");
}

main().catch(console.error);
