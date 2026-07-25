# `@agentshare/mcp-server`

**Model Context Protocol (MCP) server for AgentShare — expose secure file, memory, and state sharing via pathway tokens to any MCP-compatible agent.**

[![MCP Version](https://img.shields.io/badge/MCP_SDK-v1.29.0-purple?style=flat-square)](https://modelcontextprotocol.io/)
[![Stage: Closed Beta](https://img.shields.io/badge/Stage-Stage_1_Closed_Beta-5EEAD4?style=flat-square)](../../README.md)

---

## Capabilities

`@agentshare/mcp-server` equips AI agents in Claude Desktop, Cursor, VS Code, and custom MCP clients with native tools to share context, selectively slice payloads, and enforce token security.

* ✅ **`agentshare_share`**: Upload files or structured JSON memory snapshots and receive a short pathway token.
* ✅ **`agentshare_resolve`**: Resolve a pathway token into a stream URL or selective state slice using `keys` or `path`.
* ✅ **`agentshare_revoke`**: Permanently revoke access to a pathway token.
* ✅ **Resource Scheme**: Read tokens directly via `agentshare://token/{id}` resource URIs.

---

## Configuration

### 1. Cursor IDE (`.cursor/mcp.json`)
Add to `C:/Users/User/.cursor/mcp.json` or your project `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agentshare": {
      "command": "C:/Program Files/nodejs/node.exe",
      "args": ["D:/agentshare/packages/mcp-server/dist/index.js"],
      "env": {
        "AGENTSHARE_API_KEY": "as_e2etestkey_for_local_development_only_do_not_use_in_prod",
        "AGENTSHARE_BASE_URL": "http://127.0.0.1:3000/api"
      }
    }
  }
}
```

### 2. Claude Desktop (`claude_desktop_config.json`)
Add to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "agentshare": {
      "command": "C:/Program Files/nodejs/node.exe",
      "args": ["D:/agentshare/packages/mcp-server/dist/index.js"],
      "env": {
        "AGENTSHARE_API_KEY": "as_e2etestkey_for_local_development_only_do_not_use_in_prod",
        "AGENTSHARE_BASE_URL": "http://127.0.0.1:3000/api"
      }
    }
  }
}
```

---

## Tools Specification

### `agentshare_share`
Upload text content or a structured state object and mint a pathway token.

**Arguments:**
* `filename` (string, optional): Name of file or state snapshot.
* `content` (string, optional): Text/markdown file content.
* `state` (object, optional): Structured JSON memory/state object.
* `contentType` (string, optional): Default `application/json`.
* `scope` (string, optional): `read` (default) or `read_write`.
* `ttlSeconds` (number, optional): Expiration window in seconds (default 24h).

---

### `agentshare_resolve`
Resolve a pathway token to retrieve file URLs or selective state slices.

**Arguments:**
* `token` (string, required): Opaque pathway token (e.g. `l0VzcLlj`).
* `intent` (string, optional): `read` (default) or `write`.
* `keys` (array of strings, optional): Filter top-level JSON keys (e.g. `["summary", "decisions"]`).
* `path` (string, optional): Dot-notation JSON path (e.g. `"memory.dbEngine"`).

---

### `agentshare_revoke`
Revoke a pathway token instantly.

**Arguments:**
* `token` (string, required): Opaque pathway token to destroy.

---

## Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `AGENTSHARE_API_KEY` | No (defaults to test key) | Your AgentShare API key |
| `AGENTSHARE_BASE_URL` | No (defaults to 127.0.0.1:3000/api) | API base endpoint |
| `AGENTSHARE_AGENT_ID` | No | Agent ID for audit logs |
| `AGENTSHARE_SESSION_ID` | No | Session ID for audit logs |
| `AGENTSHARE_AGENT_ROLE` | No | Agent role for audit logs (default: `mcp-server`) |

---

## Security Model

* All requests authenticate via SHA-256 API key verification.
* Pathway token scope and TTL rules are strictly enforced.
* SHA-256 checksums are verified on resolution.
* Audit logging captures `agent_id`, `session_id`, `agent_role`, and selective query parameters.
* The server remains an opaque pipe—no payload parsing or byte inspection server-side.
