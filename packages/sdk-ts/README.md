# @agentshare/sdk

The official TypeScript SDK for AgentShare.

AgentShare is the invariant primitive for agentic memory. Upload an asset, mint a scoped token, and pass it to any LLM.

## Quickstart

### Installation

```bash
npm install @agentshare/sdk
```

### 1. Initialize

```typescript
import { AgentShare } from "@agentshare/sdk";

const client = new AgentShare({
  apiKey: "your-api-key", // Or set AGENTSHARE_API_KEY env var
  baseUrl: "http://localhost:3000/api", // Optional
});
```

### 2. Upload & Mint a Token

```typescript
import fs from "fs";

// Step 1: Initialize the upload
const { uploadUrl, assetId } = await client.upload({
  filename: "context.json",
  contentType: "application/json",
  sizeBytes: fs.statSync("context.json").size,
});

// Step 2: Upload the file directly to storage (bypassing our API)
await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: fs.readFileSync("context.json"),
});

// Step 3: Mint a short token for your agent
const { token, shareUrl } = await client.mintToken({ assetId });

console.log(`Agent can access the file at: ${shareUrl}`);
// Output: agnt.sr/x97b
```

### 3. Resolve a Token (Agent Side)

```typescript
// The agent receives the short token and resolves it to a streamable URL
const { streamUrl, filename } = await client.resolve("x97b");

// The agent streams the file directly from storage
const res = await fetch(streamUrl);
const data = await res.json();
```
