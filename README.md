<div align="center">

# agentshare

**Secure streaming memory for AI agents.**

[![npm](https://img.shields.io/npm/v/@agentshare/sdk?color=%235EEAD4&label=%40agentshare%2Fsdk)](https://www.npmjs.com/package/@agentshare/sdk)
[![PyPI](https://img.shields.io/pypi/v/agentshare-langchain?color=%235EEAD4)](https://pypi.org/project/agentshare-langchain/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Upload an asset. Mint a scoped token. Pass it to any LLM.

[Quickstart](#quickstart) · [Docs](/docs) · [API Reference](#api-reference) · [Integrations](#integrations)

</div>

---

## What is AgentShare?

AgentShare is an infrastructure primitive for AI agent workflows. Instead of stuffing large files into prompt context windows (expensive, slow, insecure), agents upload files to AgentShare and receive a short, scoped, expiring pathway token.

```
upload -> token -> resolve -> stream -> audit -> share
```

Any agent, human, or service with the token can resolve it to a secure, streaming download. Every access is audited.

## Why?

| Without AgentShare | With AgentShare |
|---|---|
| Paste 2MB JSON into prompt → $1.20/request, 15s latency | Upload once, pass `agnt.sr/x97b` → $0.001, 200ms |
| No audit trail for file access | Every resolve is logged with IP, user-agent, timestamp |
| Files die with the conversation | Tokens persist, expire on schedule, and are revocable |
| Agents can't share outputs across sessions | Any agent with the token resolves the file instantly |

## Quickstart

### TypeScript SDK

```bash
npm install @agentshare/sdk
```

```typescript
import fs from "fs";
import { AgentShare } from "@agentshare/sdk";

const client = new AgentShare({ apiKey: process.env.AGENTSHARE_API_KEY });

// 1. Upload
const { uploadUrl, assetId } = await client.upload({
  filename: "output.json",
  contentType: "application/json",
  sizeBytes: fs.statSync("output.json").size,
});
await fetch(uploadUrl, { method: "PUT", body: fs.readFileSync("output.json") });

// 2. Mint token
const { shareUrl } = await client.mintToken({ assetId });
console.log(shareUrl); // agnt.sr/x97b

// 3. Resolve (from any other agent or service)
const { streamUrl } = await client.resolve("x97b");
const data = await fetch(streamUrl).then(r => r.json());
```

### Vercel AI SDK

```bash
npm install @agentshare/vercel-ai @agentshare/sdk ai
```

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { AgentShare } from "@agentshare/sdk";
import { createAgentShareTool } from "@agentshare/vercel-ai";

const client = new AgentShare({ apiKey: process.env.AGENTSHARE_API_KEY });

const { text } = await generateText({
  model: openai("gpt-4o"),
  prompt: "Analyze this dataset and save the report.",
  tools: { agentShare: createAgentShareTool(client) },
});
// Agent uploads the report and returns: "Report saved at agnt.sr/r82q"
```

### LangChain (Python)

```bash
pip install agentshare-langchain
```

```python
from agentshare_langchain import AgentShareClient, create_agentshare_tools

client = AgentShareClient(api_key="your-key")
tools = create_agentshare_tools(client)

# Pass tools to any LangChain agent
agent_executor = AgentExecutor(agent=agent, tools=tools)
```

## API Reference

### `POST /api/upload`

Initialize an upload and receive a presigned storage URL.

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"filename":"data.json","contentType":"application/json","sizeBytes":1024}'
```

Response: `{ "assetId": "uuid", "uploadUrl": "https://..." }`

### `POST /api/token`

Mint a scoped, expiring pathway token for an uploaded asset.

```bash
curl -X POST http://localhost:3000/api/token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"assetId":"uuid","scope":"read","ttlSeconds":86400}'
```

Response: `{ "token": "x97b", "shareUrl": "agnt.sr/x97b", "expiresAt": "..." }`

### `GET /api/resolve/:token`

Resolve a pathway token into a secure, presigned stream URL.

```bash
curl http://localhost:3000/api/resolve/x97b
```

Response: `{ "filename": "data.json", "streamUrl": "https://...", "contentType": "application/json" }`

## Integrations

| Package | Runtime | Install |
|---|---|---|
| [`@agentshare/sdk`](packages/sdk-ts) | Node.js / Edge | `npm i @agentshare/sdk` |
| [`@agentshare/vercel-ai`](packages/vercel-ai) | Node.js / Edge | `npm i @agentshare/vercel-ai` |
| [`agentshare-langchain`](packages/agentshare-langchain) | Python 3.9+ | `pip install agentshare-langchain` |

## Local Development

AgentShare runs locally with Postgres and MinIO. No cloud accounts required.

```bash
git clone https://github.com/agentshare/agentshare.git
cd agentshare
npm install
cp .env.example .env.local
# Start Postgres and MinIO (see docs/troubleshooting)
npm run dev
```

> **Production migration:** The codebase uses thin adapters for database, storage, and auth. Switch to Neon + S3 + Clerk by updating environment variables only.

## Architecture

```
┌──────────┐     ┌──────────────┐     ┌───────────┐
│  Client   │────▶│  Next.js API  │────▶│  Postgres  │
│  (SDK)    │     │  Routes       │     │  (schema)  │
└──────────┘     └──────┬───────┘     └───────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  S3/MinIO     │
                 │  (storage)    │
                 └──────────────┘
```

## License

MIT
