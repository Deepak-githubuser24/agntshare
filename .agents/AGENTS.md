# AgentShare — Project Description & Agent Instructions

This file is the source of truth for any AI agent (Claude Code, Antigravity, etc.) working in
this repo. Read it before making changes. It intentionally separates **what's real today** from
**what's vision** — do not blur these two when writing code, docs, or copy.

## Mission

AgentShare is a developer-first protocol and runtime layer for secure AI handoffs, snapshots,
and shared execution state. The goal: become the default way developers and agents move work,
context, and live debugging state across tools, models, and environments — simple to adopt,
production-grade, enterprise-trusted, and embedded deeply enough in real workflows, audit
trails, and cross-platform interoperability that it's hard to replace.

Core promise: one token or one integration lets an agent capture, share, resume, or verify work
without rebuilding its stack. Philosophy: open core for developers, enterprise governance for
organizations, protocol-like distribution rather than "just another app."

**One-liner (for anything customer-facing today):** AgentShare lets AI agents securely share
files and artifacts through short-lived, scoped, audited tokens — MCP-native, so it works with
any MCP-compatible agent out of the box.

*(The longer "trust and handoff layer... capture, share, resume, and audit real work" framing
is the north star, not current-state copy. Don't use "resume" or "live execution state" in
anything a user or investor reads until that capability actually exists — see below.)*

---

## What's actually built and verified today

- Upload → S3-compatible storage via presigned URLs.
- Short opaque "pathway token" per asset — TTL, scope (read/read_write/admin), revocation.
- Resolve endpoint: token → presigned streaming URL. Byte-range capable, server never touches
  file bytes directly.
- Postgres audit log on upload / token mint / token resolve.
- Real auth: password auth via Auth.js (bcrypt-hashed), API keys (SHA-256-hashed, server-
  generated only), invite-gated signup for the closed beta.
- Rate limiting, `/api/events` lockdown, least-privilege DB role (`agentshare_app`).
- Landing page, dashboard shell, closed-beta disclosure banner.

**This is file/artifact sharing with strong security fundamentals.** It is not yet execution-
state capture, "resume," or cross-model handoff of live agent memory.

## Near-term roadmap (concrete, buildable extensions of what exists)

- **MCP server layer** — expose `agentshare_share` / `agentshare_resolve` as MCP tools plus an
  `agentshare://token/{id}` resource URI. This is the highest-leverage next step: it's the
  "protocol-first, MCP-native" part of the mission and it's a real, gap-filling addition to
  today's MCP spec (no standardized audit trail or large-binary handling in MCP itself).
  **Hold this until the July 28, 2026 MCP spec finalizes** (stateless core, new transport
  headers) — build against the final spec, not the release candidate, to avoid rework.
- **Verification** — `checksum_sha256` already exists on `assets`. Surfacing/exposing this as a
  first-class "verify" feature (confirm an artifact hasn't changed since it was shared) is a
  small, real step toward the "verify work" promise — not the whole promise.
- **Agent identity in the schema** — add `agent_id`, `session_id`, `agent_role` to `audit_logs`
  (and wherever `owner_id` is used). This is metadata only, no payload inspection required, no
  new liability — cheap to build and it directly strengthens the audit-trail differentiator.
  Safe to build alongside or shortly after the Stage 1 closed beta launch.
- TypeScript/Python SDKs as thin wrappers over the same REST API.

## Long-term vision — NOT YET DESIGNED, treat as R&D, not a roadmap item

- **Execution-state snapshots / "resume."** This means capturing an agent's actual runtime
  state (memory, in-flight tool calls, conversation/session state) and restoring it elsewhere.
  This is a different problem from file storage — it likely requires framework-specific
  integration (each agent framework represents "state" differently), not just a bigger token.
  Do not scope this into a sprint alongside the current fixes. It needs its own design pass:
  what "state" means per framework, how much of it is even serializable, and what the security
  model looks like for restoring live state on someone else's behalf.
- **Cross-model / cross-platform interoperability** beyond MCP — depends on what "resume" ends
  up meaning technically.
- **Enterprise governance layer** (SSO, org-level policy, compliance exports) — per the staged
  roadmap, this comes after real usage data from a closed beta, not before.

### Architecture principle: metadata-driven, not payload-inspecting

The core server stays a **dumb, opaque pipe** — presigned URLs mean it never reads or touches
file bytes. That's a real strength: cheap to scale, small compliance surface, no liability for
what's inside a payload. Do not implement server-side payload inspection.

Where framework/version compatibility checks or secret redaction are wanted, the resolution is
**metadata-driven, not byte-inspecting**: the client SDK submits lightweight tags at upload time
(e.g. `framework: "langchain"`, `frameworkVersion: "0.2.1"`) into a `client_metadata` JSONB
column. The receiving agent reads this metadata before resolving and decides how to handle a
mismatch itself — the server never parses or understands the actual state payload. If redaction
is ever built, it lives client-side in the open-source SDK, before upload, so unredacted secrets
never reach AgentShare's servers at all.

This does not eliminate the maintenance burden of tracking framework version compatibility — it
relocates it to client-side SDK adapters (open-source, community-contributable, no server-side
liability) instead of eliminating it. Be accurate about that distinction internally and
externally: "client-side adapters" is real, ongoing work, not a solved problem.

Note also: because this logic lives in an open-source client SDK, it is not a competitive moat
by itself — it's readable and forkable by anyone. The durable asset here is the accumulated
audit trail and developer trust over time, not the mechanism. Don't let external-facing copy
claim otherwise.

### Open architectural fork — mostly resolved above; still open

Whether to ever build client-side best-effort secret/PII scrubbing in the SDK is still an open
decision, not committed. If pursued, it must ship as clearly-labeled best-effort, never marketed
as a guarantee — an oversold redaction claim followed by a missed secret is a worse outcome than
not offering it.

A cross-framework state *translation* layer (LangChain ↔ CrewAI ↔ AutoGen, not just version
compatibility within one framework) remains open R&D, not a scoped feature — semantically
different state models aren't guaranteed to have a lossless or even meaningful mapping in
general. Address this via client-side adapters/hooks per framework if it's pursued at all, not
a server-side universal translator.

None of this means don't pursue any of it — it means: write a design doc when there's
bandwidth, but don't schedule implementation until Stage 1 has produced real usage data.

---

## Standing instructions for any agent working in this repo

1. **Don't imply roadmap or vision items are built.** If code, comments, or user-facing copy
   reference "resume," "execution state," or "live debugging state," flag it — that capability
   doesn't exist yet.
2. **Security fixes are non-negotiable and already verified** (auth, rate limiting, least-
   privilege DB role, invite gate). Don't regress them while adding new features.
3. **Verification bar:** any claim of "done" needs actual command output / observed behavior,
   not a description of expected behavior. This has been the standard throughout — keep it.
4. **Follow the staged rollout:** Stage 0 (security, done) → Stage 1 (closed beta, current) →
   Stage 2 (public listing) → Stage 3 (ecosystem breadth) → Stage 4 (enterprise wedge). Don't
   build Stage 3/4 features before Stage 1 has real usage data.
5. **Terminology:** "pathway token," not "link" or "share URL," in code and docs — keep it
   consistent with the schema and existing copy.
