# `@agentshare/sdk`

**Official TypeScript SDK for AgentShare — secure file, memory, and project state sharing for AI agents.**

[![npm](https://img.shields.io/badge/npm-v1.0.0-blue?style=flat-square)](https://www.npmjs.com/package/@agentshare/sdk)
[![Stage: Closed Beta](https://img.shields.io/badge/Stage-Stage_1_Closed_Beta-5EEAD4?style=flat-square)](../../README.md)

---

## Installation

```bash
npm install @agentshare/sdk
```

---

## Quickstart

### 1. Initialize Client

```typescript
import { AgentShare } from "@agentshare/sdk";

const client = new AgentShare({
  apiKey: process.env.AGENTSHARE_API_KEY || "as_e2etestkey_for_local_development_only_do_not_use_in_prod",
  baseUrl: "http://127.0.0.1:3000/api",
  agentId: "agent-planner-v1",
  sessionId: "session-404",
  agentRole: "architect",
});
```

### 2. Share Structured Memory & Project State

```typescript
const { token, shareUrl, checksumSha256 } = await client.shareState({
  state: {
    summary: "Refactored user billing pipeline to async queue",
    decisions: ["Decouple Stripe webhook processing from HTTP request cycle"],
    memory: { dbEngine: "PostgreSQL 16", cacheEngine: "Redis 7.2" },
  },
  filename: "billing-state.json",
  scope: "read",
  ttlSeconds: 3600,
});

console.log(`Pathway Token: ${token}`);
// Output: Pathway Token: l0VzcLlj
```

### 3. Selective Retrieval (Receiving Agent)

Save prompt tokens by requesting only the exact fields your receiving agent needs:

```typescript
// Filter top-level keys
const { state } = await client.resolveState("l0VzcLlj", {
  keys: ["summary", "decisions"],
});
console.log(state.summary);

// Extract dot-notation sub-tree path
const pathRes = await client.resolveState("l0VzcLlj", {
  path: "memory.dbEngine",
});
console.log(pathRes.state); // "PostgreSQL 16"
```

### 4. Revoke Token (Cleanup)

```typescript
await client.revokeToken("l0VzcLlj");
```

---

## API Methods

* `shareState(options)`: Share structured JSON state, calculate SHA-256 checksum, upload to storage, and mint token.
* `resolveState(token, options)`: Resolve state token with optional `keys` array filtering or dot-notation `path` extraction.
* `upload(options)`: Initialize direct file upload and receive presigned URL.
* `mintToken(options)`: Mint scoped pathway token for an uploaded asset ID.
* `resolve(token, options)`: Resolve token into presigned download URL and metadata.
* `revokeToken(token)`: Instantly revoke a pathway token.
* `AgentShare.selectFromJSON(data, keys, path)`: Client-side JSON slicing utility.
