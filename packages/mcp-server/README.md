# @agentshare/mcp-server

MCP (Model Context Protocol) server for AgentShare — lets any MCP-compatible agent securely share files via pathway tokens.

## Quick Start

```bash
cd packages/mcp-server
npm install
```

Set your API key:
```bash
export AGENTSHARE_API_KEY=agnt_your_key_here
export AGENTSHARE_BASE_URL=http://localhost:3000/api  # optional, defaults to localhost
```

Run:
```bash
npx tsx src/index.ts
```

## Tools

### `agentshare_share`
Upload content and mint a pathway token.

```json
{
  "filename": "analysis.md",
  "content": "# Results\nConfidence: 94%",
  "contentType": "text/markdown",
  "scope": "read",
  "ttlSeconds": 3600
}
```

### `agentshare_resolve`
Resolve a pathway token to retrieve shared content.

```json
{
  "token": "x97b",
  "intent": "read"
}
```

### `agentshare_revoke`
Revoke a pathway token to destroy access.

```json
{
  "token": "x97b"
}
```

## Resource URI

Read shared content directly via `agentshare://token/{id}`.

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentshare": {
      "command": "npx",
      "args": ["tsx", "/path/to/agentshare/packages/mcp-server/src/index.ts"],
      "env": {
        "AGENTSHARE_API_KEY": "agnt_your_key_here",
        "AGENTSHARE_BASE_URL": "https://your-agentshare-instance.com/api"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AGENTSHARE_API_KEY` | Yes | Your AgentShare API key |
| `AGENTSHARE_BASE_URL` | No | API base URL (default: `http://localhost:3000/api`) |
| `AGENTSHARE_AGENT_ID` | No | Agent identity for audit logs |
| `AGENTSHARE_SESSION_ID` | No | Session identity for audit logs |
| `AGENTSHARE_AGENT_ROLE` | No | Agent role for audit logs (default: `mcp-server`) |

## Security

- All requests are authenticated via API key
- Token scopes are enforced (read vs read_write)
- SHA-256 checksums are computed on upload and verified on resolve
- Agent identity is propagated to audit logs
- The server never inspects or stores file payloads — it's an opaque pipe
