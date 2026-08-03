# Agntshare Protocol Specification (`agntshare-protocol`)

**The Open Standard for AI Agent State Portability, Memory Sharing, and Handoffs.**

[![Protocol Version](https://img.shields.io/badge/RFC_Spec-v1.0.0-5EEAD4?style=flat-square)](schema/pathway_token_v1.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 1. Overview & Problem Statement

As multi-agent workflows scale across frameworks (LangChain, CrewAI, LlamaIndex, AutoGen, and custom runtimes), passing raw execution state, datasets, and conversation context creates three fundamental problems:

1. **Context Window Token Bloat:** Stuffing 2MB+ JSON state blobs into LLM prompt windows costs $1.00+ per request and adds 10-15 seconds of latency.
2. **Hallucination & Context Drift:** Multi-turn state serialization through LLM context windows degrades accuracy over long agent chains.
3. **Security & Audit Vacuum:** Unencrypted, un-scoped payload passing leaves zero access logs or cryptographic proof of provenance.

**Agntshare is the "HTTPS for AI Agent Collaboration."** It standardizes agent state portability by decoupling state storage from agent execution using lightweight, verifiable **Pathway Tokens**.

---

## 2. Core Architectural Principles (The 3 Inviolable Laws)

### Law 1: The Server is Blind (Zero-Trust Transport)
The Agntshare backend (`agntshare-core`) operates strictly as an $O(1)$ RAM, high-throughput **dumb pipe**. The server *never* touches, parses, inspects, or unzips binary state payloads. All data transfers occur via direct presigned S3/R2 URLs. Payload serialization and inspection happen exclusively on client-side SDK adapters.

### Law 2: The Token is the Truth (Lightweight & Verifiable)
Pathway Tokens (e.g., `agnt.sr/l0VzcLlj`) carry no raw state. They contain references, SHA-256 integrity checksums, mandatory TTL (Time-To-Live) expiration timestamps, scope rules (`read`, `read_write`), and cryptographic client signatures.

### Law 3: Zero Friction Adoption (The Cursor Strategy)
Integration requires zero manual HTTP fetching code. Developers adopt Agntshare through 1-line drop-in framework hooks (`@agentshare/sdk`, `@agentshare/mcp-server`, `agentshare-python`).

---

## 3. The Pathway Token Primitive

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGNTSHARE PATHWAY TOKEN PROTOCOL FLOW                    │
└─────────────────────────────────────────────────────────────────────────────┘
  Agent A (Planner / LangChain)          Agntshare Protocol         Agent B (Coder / Cursor)
         │                                       │                             │
         │─── 1. Upload & Mint Token ───────────▶│                             │
         │    (Metadata + SHA-256 Checksum)      │                             │
         │                                       │                             │
         │────────────────────── 2. Pass Short Token 'l0VzcLlj' ──────────────▶│
         │                                       │                             │
         │                                       │◀── 3. Selective Resolve ────│
         │                                       │    (?keys=summary)          │
         │                                       │                             │
         │                                       │─── 4. Streamed Payload ─────▶│
```

---

## 4. Specification Files

This repository (`agntshare-protocol`) is the official open-source RFC definition. It contains **zero runtime backend code** and holds strictly standard specifications:

* 📄 **[`schema/pathway_token_v1.json`](schema/pathway_token_v1.json):** Strict JSON Schema (Draft 2020-12) defining the `pathway_token_v1` metadata contract.

### Required Pathway Token Fields (`pathway_token_v1.json`)

| Field | Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `schema_version` | `string` | Regex `^\d+\.\d+\.\d+$` | Semantic version of the protocol spec (e.g. `1.0.0`) |
| `framework` | `string` | Non-empty | Originating framework (`langchain`, `crewai`, `autogen`, `custom`) |
| `intent` | `string` | Enum `["read", "read_write"]` | Granted access scope intent |
| `ttl_seconds` | `integer` | `minimum: 1` (> 0) | Mandatory expiration window in seconds |
| `cryptographic_signature` | `string` | Non-empty | Provenance signature produced by client SDK |
| `payload_checksum` | `string` | SHA-256 (`^[a-fA-F0-9]{64}$`) | Hex digest hash of unparsed payload bytes |

---

## 5. Repository Policy

Per Agntshare Architectural Directives:
* **`agntshare-protocol` repository holds strictly markdown documentation, RFCs, and JSON/OpenAPI schema files.**
* **Zero runtime backend or SDK code is permitted in this repository.**

---

## License

[MIT](LICENSE) © Agntshare Open Standard Contributors
