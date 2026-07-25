# AgentShare (`agntshare`)

**AgentShare lets AI agents securely share files, memory, and project state through short-lived, scoped, audited pathway tokens.**

[![Stage: Closed Beta](https://img.shields.io/badge/Stage-Stage_1_Closed_Beta-5EEAD4?style=flat-square)](app/docs/page.tsx)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![MCP Native](https://img.shields.io/badge/MCP-Native_Tools-purple?style=flat-square)](packages/mcp-server)

---

## What Problem Does AgentShare Solve?

When AI agents pass large files, working memory, or project state to each other, developers currently face three bad choices:
1. **Stuffing raw payloads into prompt context windows:** Expensive ($1.00+ per request), slow (adds 10-15s latency), and hits context limits.
2. **Writing ad-hoc shared filesystem glue:** Complex to maintain, leaks file paths, and works only when agents share a single local machine.
3. **Passing un-audited S3 links:** No scope enforcement, no access logging, and no automatic TTL expiration.

**AgentShare is an infrastructure primitive and runtime layer designed for agent-to-agent handoffs.** Agents upload context once, receive a short opaque pathway token (e.g. `l0VzcLlj`), and pass only the token. The receiving agent selectively retrieves only the fields it needs, verified by SHA-256 checksums and logged to an audit trail.

---

## What Works Today (Stage 1 Closed Beta)

AgentShare is currently a **functional, verified foundation (Stage 1 Closed Beta)**:

* ✅ **Structured Memory & State Sharing:** `shareState()` and `resolveState()` serialize JSON snapshots, calculate SHA-256 checksums, and manage storage.
* ✅ **Selective Retrieval (`keys` & `path`):** Receiving agents can request specific top-level JSON keys (`keys: ["summary"]`) or extract sub-tree paths (`path: "memory.dbEngine"`), saving prompt tokens.
* ✅ **Native MCP Server (`@agentshare/mcp-server`):** Built on `@modelcontextprotocol/sdk` v1.29.0 exposing `agentshare_share`, `agentshare_resolve`, and `agentshare_revoke` tools + `agentshare://token/{id}` resource URI.
* ✅ **File & Large Binary Sharing:** Opaque S3/R2 presigned streaming URLs. The server acts as a dumb, un-inspecting pipe.
* ✅ **Zero-Dependency Dev Storage:** Includes built-in `/api/dev-storage` for local S3-free testing out of the box.
* ✅ **Security & Audit Logging:** API key authentication (SHA-256 hashed), scoped tokens (`read`, `read_write`, `admin`), instant token revocation, and PostgreSQL audit logging (`agent_id`, `session_id`, `agent_role`).

> **Honest Disclosure — What is NOT built yet:** AgentShare does *not* currently inspect file bytes server-side or attempt live process execution state restoration ("memory resume"). Cross-model state translation remains long-term R&D.

---

## Quickstart

### 1. TypeScript SDK (`@agentshare/sdk`)

#### Install:
```bash
npm install @agentshare/sdk
```

#### Share & Selectively Retrieve Structured State:
```typescript
import { AgentShare } from "@agentshare/sdk";

const client = new AgentShare({
  apiKey: process.env.AGENTSHARE_API_KEY || "as_e2etestkey_for_local_development_only_do_not_use_in_prod",
  baseUrl: "http://127.0.0.1:3000/api",
  agentId: "planner-agent-01",
});

// 1. Agent A shares structured state snapshot
const { token, shareUrl, checksumSha256 } = await client.shareState({
  state: {
    summary: "Refactored user billing pipeline to async queue",
    decisions: ["Decouple Stripe webhook processing"],
    memory: { dbEngine: "PostgreSQL 16", cache: "Redis 7" },
  },
  scope: "read",
  ttlSeconds: 3600,
});
console.log(`Pathway Token: ${token} | Share URL: ${shareUrl}`);

// 2. Agent B selectively retrieves ONLY the fields it needs (skipping 'memory' to save tokens)
const { state } = await client.resolveState(token, {
  keys: ["summary", "decisions"],
});
console.log("Selective Summary:", state.summary);

// 3. Agent C revokes access when handoff completes
await client.revokeToken(token);
```

---

### 2. MCP Integration (Claude Desktop & Cursor)

AgentShare runs natively as an MCP server. Any MCP-compatible agent can share, selectively retrieve, and revoke pathway tokens without custom code.

#### Add to Cursor (`.cursor/mcp.json`) or Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "agentshare": {
      "command": "node",
      "args": ["D:/agentshare/packages/mcp-server/dist/index.js"],
      "env": {
        "AGENTSHARE_API_KEY": "as_e2etestkey_for_local_development_only_do_not_use_in_prod",
        "AGENTSHARE_BASE_URL": "http://127.0.0.1:3000/api"
      }
    }
  }
}
```

#### Try in AI Chat:
> *"Use AgentShare to share a project snapshot: summary='Refactored database pipeline', status='completed'."*

---

## Packages & Integrations

| Package | Purpose | Path |
| :--- | :--- | :--- |
| **`@agentshare/sdk`** | TypeScript SDK for file & state sharing | [`packages/sdk-ts`](packages/sdk-ts) |
| **`@agentshare/mcp-server`** | Native MCP server for Claude Desktop & Cursor | [`packages/mcp-server`](packages/mcp-server) |
| **`agentshare-langchain`** | LangChain tool integration wrapper | [`packages/agentshare-langchain`](packages/agentshare-langchain) |

---

## API Reference

### `POST /api/upload`
Initialize an asset upload and receive a presigned storage URL.

### `POST /api/token`
Mint a scoped (`read`, `read_write`), expiring pathway token.

### `GET /api/resolve/:token`
Resolve a token to streaming presigned download URL or selective state object (`?keys=summary` or `?path=memory.dbEngine`).

### `DELETE /api/token/:token`
Instantly revoke a pathway token.

---

## Local Development (Quick Run)

```bash
# 1. Clone & install
git clone https://github.com/techbitaibytes-bit/agentshare.git
cd agentshare
npm install

# 2. Set DATABASE_URL in .env.local
DATABASE_URL="postgresql://user:pass@host:5432/agentshare?sslmode=require"

# 3. Initialize database tables & test key
npx tsx scripts/init-db.ts

# 4. Start local dev server
npm run dev

# 5. Run the multi-agent handoff demonstration
npx tsx examples/multi-agent-handoff.ts
```

---

## Project Status & Roadmap

AgentShare follows a staged rollout plan:

* **Stage 0 (Security Core):** Auth.js, SHA-256 API key hashing, rate limiting, S3 presigned URLs. *(Completed)*
* **Stage 1 (Closed Beta — Current):** Native MCP server, structured memory/state sharing, selective retrieval (`keys`/`path`), audit trails. *(Current)*
* **Stage 2 (Public Listing):** Global npm package releases, Python SDK (`agentshare-python`), public cloud hosting. *(Upcoming)*
* **Stage 3 (Ecosystem Breadth):** Agent framework adapters (CrewAI, AutoGen, LangGraph). *(Upcoming)*
* **Stage 4 (Enterprise Wedge):** Org-level governance, SSO, and compliance export logs. *(Long-term)*

---

## Contributing & Feedback

We welcome feedback, issues, and contributions from developers building agentic workflows!

* **Report Issues:** Open a GitHub Issue with reproduction steps.
* **Closed Beta Feedback:** Email `beta@agentshare.dev` or reach out via issues.

---

## License

[MIT](LICENSE) © AgentShare Contributors
