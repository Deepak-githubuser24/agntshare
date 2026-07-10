# Product Hunt — AgentShare

## Tagline

Secure streaming memory for AI agents

## Description

### The problem

AI agents that need to pass files between each other have two bad options: stuff the raw content into the context window (expensive, slow, risks truncation) or write to a shared filesystem (no access control, no audit trail, no way to revoke access). A 2MB JSON file costs ~$5 in token fees every time it passes through a prompt. In multi-agent pipelines, those costs multiply with each hop.

### The primitive

AgentShare is an infrastructure layer that replaces raw file passing with scoped, auditable tokens. The flow is six steps: **upload → token → resolve → stream → audit → share**. The sending agent uploads a file to object storage, receives a short token (e.g., `agnt.sr/x97b`), and passes that token — not the file — in the context. The receiving agent resolves the token into a presigned stream URL and fetches the content directly from storage. Every access is logged. Tokens are scoped (`read`, `read_write`, `admin`), have configurable expiration, and can be revoked. The context window cost drops from hundreds of thousands of tokens to about 10.

### Packages

AgentShare ships as three packages that cover the major agent development surfaces. **`@agentshare/sdk`** is the core TypeScript client for upload, token minting, and resolution. **`@agentshare/vercel-ai`** provides a drop-in tool for the Vercel AI SDK — call `createAgentShareTool(client)` and the agent can share and resolve files as standard tool invocations. **`agentshare-langchain`** is the Python integration for LangChain, providing `BaseTool` subclasses with Pydantic schemas. All three packages use the same API and the same audit log.

## Key Features

- **Token-scoped file access** — Agents receive short tokens instead of raw file content. Tokens support `read`, `read_write`, and `admin` scopes with configurable TTL.
- **Append-only audit log** — Every upload, mint, resolve, and revoke event is written to PostgreSQL with actor, IP, timestamp, and metadata. Full trail for debugging and compliance.
- **Direct-to-storage streaming** — Files are uploaded and streamed via presigned S3 URLs. Content never passes through the API server on read, keeping latency low and throughput high.
- **Framework integrations** — First-class tools for Vercel AI SDK (TypeScript) and LangChain (Python). Agents call `share` and `resolve` as standard tool invocations — no custom plumbing.
- **Self-hostable** — Next.js API, PostgreSQL, and any S3-compatible store. Run locally with MinIO or deploy to your own cloud. MIT licensed.

## Maker Comment

We built AgentShare because we kept running into the same problem in multi-agent systems: there was no clean way for agents to pass files to each other without either blowing up the context window or losing all auditability.

The core idea is simple — treat file sharing between agents the same way you'd treat it between services: with scoped credentials, expiration, and a log. The primitive is `upload → token → resolve → stream → audit → share`.

We're shipping three packages:

- `@agentshare/sdk` — TypeScript core
- `@agentshare/vercel-ai` — Vercel AI SDK tool
- `agentshare-langchain` — LangChain Python

The whole thing is self-hostable (Next.js + PostgreSQL + S3-compatible storage) and MIT licensed.

We'd genuinely appreciate feedback on the token scoping model and whether the primitive is general enough for the multi-agent orchestration patterns you're building. What access control patterns are we missing?

GitHub: https://github.com/agentshare/agentshare
Docs: https://docs.agentshare.dev
