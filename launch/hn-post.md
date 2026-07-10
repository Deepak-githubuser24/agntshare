# Show HN: AgentShare – Secure streaming memory for AI agents

**Problem:** AI agents that need to pass files between each other have no auditable, scoped mechanism to do it. Today, agents either stuff entire payloads into the context window (expensive, slow, loses fidelity) or write to a shared filesystem (no access control, no audit trail, no revocation).

**What AgentShare is:** An infrastructure primitive with six steps:

```
upload → token → resolve → stream → audit → share
```

You upload a file. You get back a short, scoped token (`agnt.sr/x97b`). The receiving agent resolves that token into a presigned stream URL. Every access is logged. Tokens expire and can be revoked.

The agent never sees the raw file in its context window — it just gets a 4-character token.

**Code (TypeScript SDK):**

```typescript
import { AgentShare } from "@agentshare/sdk";

const client = new AgentShare({ apiKey: process.env.AGENTSHARE_API_KEY });
const { uploadUrl, assetId } = await client.upload({ filename: "report.json", contentType: "application/json", sizeBytes: 204800 });
await fetch(uploadUrl, { method: "PUT", body: fileBuffer });
const { token, shareUrl } = await client.mintToken({ assetId, scope: "read" });
// Agent receives: agnt.sr/x97b — 4 chars instead of 200KB in context
```

**Three packages:**

- `@agentshare/sdk` — Core TypeScript client (upload, mint, resolve)
- `@agentshare/vercel-ai` — Drop-in Vercel AI SDK tool via `createAgentShareTool()`
- `agentshare-langchain` — LangChain Python integration via `create_agentshare_tools()`

**Architecture:** Next.js API routes, PostgreSQL for token/audit storage, S3-compatible object storage (MinIO locally, any S3 API in production). Tokens are scoped (`read`, `read_write`, `admin`) with configurable TTL. Every resolve, upload, and mint is written to `audit_logs`.

Self-hostable. MIT licensed.

- Docs: https://docs.agentshare.dev
- GitHub: https://github.com/agentshare/agentshare

Looking for feedback on the token scoping model and whether the primitive is general enough for multi-agent orchestration frameworks.
