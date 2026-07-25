/**
 * AgentShare MCP Server
 *
 * Exposes AgentShare's secure file/artifact/memory sharing via the Model Context Protocol.
 * Built using the official `@modelcontextprotocol/sdk`.
 *
 * Exposes 3 core tools:
 *   - `agentshare_share`: Share structured agent memory / state OR plain text file content
 *   - `agentshare_resolve`: Resolve a pathway token with optional selective retrieval (`keys` or `path`)
 *   - `agentshare_revoke`: Revoke a pathway token to permanently destroy access
 *
 * Exposes 1 resource:
 *   - `agentshare://token/{token}`: Read shared content directly via resource URI
 *
 * Transport: stdio (for local agent integrations like Claude Desktop / Cursor)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { createHash } from "node:crypto";

// ─── Configuration ──────────────────────────────────────────────────────────

export interface AgentShareMCPConfig {
  apiKey: string;
  baseUrl?: string;
  agentId?: string;
  sessionId?: string;
  agentRole?: string;
}

function loadConfig(): AgentShareMCPConfig {
  const apiKey = process.env.AGENTSHARE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AGENTSHARE_API_KEY environment variable is required.\n" +
      "Set it before starting the MCP server:\n" +
      "  export AGENTSHARE_API_KEY=agnt_..."
    );
  }
  return {
    apiKey,
    baseUrl: process.env.AGENTSHARE_BASE_URL ?? "http://localhost:3000/api",
    agentId: process.env.AGENTSHARE_AGENT_ID,
    sessionId: process.env.AGENTSHARE_SESSION_ID,
    agentRole: process.env.AGENTSHARE_AGENT_ROLE ?? "mcp-server",
  };
}

// ─── HTTP Client ────────────────────────────────────────────────────────────

async function apiRequest<T>(
  config: AgentShareMCPConfig,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "x-user-id": config.apiKey,
  };

  if (config.agentId) headers["x-agent-id"] = config.agentId;
  if (config.sessionId) headers["x-session-id"] = config.sessionId;
  if (config.agentRole) headers["x-agent-role"] = config.agentRole;

  if (body && method !== "GET" && method !== "DELETE") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errMsg = (data as Record<string, string>)?.error ?? `HTTP ${res.status}`;
    throw new McpError(ErrorCode.InternalError, `AgentShare API error: ${errMsg}`);
  }

  return data as T;
}

// ─── Helper: Selective JSON Extraction ─────────────────────────────────────

function selectFromJSON(data: any, keys?: string[], path?: string): any {
  if (!data || typeof data !== "object") return data;

  if (path) {
    const parts = path.split(".");
    let current = data;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }

  if (keys && keys.length > 0) {
    const result: Record<string, any> = {};
    for (const key of keys) {
      if (key in data) {
        result[key] = data[key];
      }
    }
    return result;
  }

  return data;
}

// ─── Response Interfaces ───────────────────────────────────────────────────

interface UploadResponse { assetId: string; uploadUrl: string }
interface MintResponse { token: string; shareUrl: string; scope: string; expiresAt: string }
interface ResolveResponse {
  filename: string; contentType: string; sizeBytes: number;
  scope: string; streamUrl: string; checksumSha256?: string | null;
}
interface RevokeResponse { success: boolean; token: string; revokedAt: string }

// ─── MCP Server Initialization ──────────────────────────────────────────────

export function createAgentShareServer(config: AgentShareMCPConfig): Server {
  const server = new Server(
    {
      name: "agentshare",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // ── 1. List Tools Handler ────────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "agentshare_share",
        description:
          "Upload content or structured agent memory/state to AgentShare and mint a short pathway token. " +
          "Pass either text `content` OR structured `state` object (e.g. summary, decisions, memory). " +
          "Returns a pathway token. Every upload is SHA-256 checksummed and access is audited.",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: 'Name for the shared file, e.g. "report.json" or "state.json"',
            },
            content: {
              type: "string",
              description: "Raw text content to share (if sharing plain text)",
            },
            state: {
              type: "object",
              description: "Structured state/memory object to share (e.g. { summary, decisions, memory, context })",
            },
            contentType: {
              type: "string",
              description: 'MIME type, defaults to "text/plain" (or "application/json" if state object provided)',
            },
            scope: {
              type: "string",
              enum: ["read", "read_write", "admin"],
              description: 'Access scope for the token. Defaults to "read"',
            },
            ttlSeconds: {
              type: "number",
              description: "Time-to-live in seconds for the pathway token. Defaults to 24 hours",
            },
          },
        },
      },
      {
        name: "agentshare_resolve",
        description:
          "Resolve a pathway token to retrieve shared content or structured agent state. " +
          "Supports SELECTIVE RETRIEVAL: pass `keys` (e.g. [\"summary\", \"decisions\"]) or dot-notation `path` (e.g. \"memory.database\") " +
          "to retrieve only the required context slice, saving prompt tokens. " +
          "Automatically verifies the SHA-256 checksum if present.",
        inputSchema: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: 'The pathway token to resolve, e.g. "x97b"',
            },
            intent: {
              type: "string",
              enum: ["read", "write"],
              description: 'Access intent. Use "write" only if you need an upload URL to update the file',
            },
            keys: {
              type: "array",
              items: { type: "string" },
              description: 'Selective retrieval: array of top-level keys to extract (e.g. ["summary", "decisions"])',
            },
            path: {
              type: "string",
              description: 'Selective retrieval: dot-notation path to extract (e.g. "memory.database")',
            },
          },
          required: ["token"],
        },
      },
      {
        name: "agentshare_revoke",
        description:
          "Revoke a pathway token to permanently destroy access. " +
          "Use this when a shared artifact is no longer needed or after a handoff is complete.",
        inputSchema: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "The pathway token to revoke",
            },
          },
          required: ["token"],
        },
      },
    ],
  }));

  // ── 2. Call Tool Handler ─────────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "agentshare_share") {
      let content: string;
      let contentType: string;

      if (args?.state && typeof args.state === "object") {
        content = JSON.stringify(args.state, null, 2);
        contentType = (args?.contentType as string) ?? "application/json";
      } else if (typeof args?.content === "string") {
        content = args.content;
        contentType = (args?.contentType as string) ?? "text/plain";
      } else {
        throw new McpError(ErrorCode.InvalidParams, "Either 'content' string or 'state' object is required");
      }

      const filename = String(args?.filename ?? `artifact-${Date.now()}.${contentType.includes("json") ? "json" : "txt"}`);
      const scope = (args?.scope as "read" | "read_write" | "admin") ?? "read";
      const ttlSeconds = typeof args?.ttlSeconds === "number" ? args.ttlSeconds : undefined;

      const contentBytes = Buffer.from(content, "utf-8");
      const checksumSha256 = createHash("sha256").update(contentBytes).digest("hex");

      const upload = await apiRequest<UploadResponse>(config, "POST", "/upload", {
        filename,
        contentType,
        sizeBytes: contentBytes.byteLength,
        checksumSha256,
      });

      const putRes = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: contentBytes,
      });

      if (!putRes.ok) {
        throw new McpError(ErrorCode.InternalError, `Storage upload failed: HTTP ${putRes.status}`);
      }

      const mint = await apiRequest<MintResponse>(config, "POST", "/token", {
        assetId: upload.assetId,
        scope,
        ...(ttlSeconds ? { ttlSeconds } : {}),
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              token: mint.token,
              shareUrl: mint.shareUrl,
              assetId: upload.assetId,
              scope: mint.scope,
              expiresAt: mint.expiresAt,
              checksumSha256,
              filename,
            }, null, 2),
          },
        ],
      };
    }

    if (name === "agentshare_resolve") {
      const token = String(args?.token ?? "");
      const intent = args?.intent === "write" ? "write" : undefined;
      const keys = Array.isArray(args?.keys) ? (args.keys as string[]) : undefined;
      const path = typeof args?.path === "string" ? args.path : undefined;

      if (!token) {
        throw new McpError(ErrorCode.InvalidParams, "token is required");
      }

      const queryParams = new URLSearchParams();
      if (intent) queryParams.set("intent", intent);
      if (keys && keys.length > 0) queryParams.set("keys", keys.join(","));
      if (path) queryParams.set("path", path);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const resolved = await apiRequest<ResolveResponse>(config, "GET", `/resolve/${token}${queryString}`);

      const fileRes = await fetch(resolved.streamUrl);
      if (!fileRes.ok) {
        throw new McpError(ErrorCode.InternalError, `Failed to fetch file from storage: HTTP ${fileRes.status}`);
      }

      const rawText = await fileRes.text();

      let checksumValid: boolean | null = null;
      if (resolved.checksumSha256) {
        const actualHash = createHash("sha256").update(Buffer.from(rawText, "utf-8")).digest("hex");
        checksumValid = actualHash.toLowerCase() === resolved.checksumSha256.toLowerCase();
      }

      // Check if structured JSON content and selective retrieval requested
      let finalContent: any = rawText;
      let isJSON = false;
      try {
        const jsonObj = JSON.parse(rawText);
        isJSON = true;
        if (keys || path) {
          finalContent = selectFromJSON(jsonObj, keys, path);
        } else {
          finalContent = jsonObj;
        }
      } catch {
        // Plain text content
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              filename: resolved.filename,
              contentType: resolved.contentType,
              sizeBytes: resolved.sizeBytes,
              scope: resolved.scope,
              checksumSha256: resolved.checksumSha256,
              checksumValid,
              selective: !!(keys || path),
              content: finalContent,
            }, null, 2),
          },
        ],
      };
    }

    if (name === "agentshare_revoke") {
      const token = String(args?.token ?? "");
      if (!token) {
        throw new McpError(ErrorCode.InvalidParams, "token is required");
      }

      const result = await apiRequest<RevokeResponse>(config, "DELETE", `/token/${token}`);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: result.success,
              token: result.token,
              revokedAt: result.revokedAt,
            }, null, 2),
          },
        ],
      };
    }

    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  });

  // ── 3. Resource Handlers ─────────────────────────────────────────────────
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "agentshare://token/{token}",
        name: "AgentShare Pathway Token Resource",
        description: "Read the content of a shared artifact by its pathway token",
        mimeType: "text/plain",
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (uri.startsWith("agentshare://token/")) {
      const token = uri.replace("agentshare://token/", "");
      const resolved = await apiRequest<ResolveResponse>(config, "GET", `/resolve/${token}`);
      const fileRes = await fetch(resolved.streamUrl);
      if (!fileRes.ok) {
        throw new McpError(ErrorCode.InternalError, `Failed to fetch file: HTTP ${fileRes.status}`);
      }
      const content = await fileRes.text();
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: resolved.contentType ?? "text/plain",
            text: content,
          },
        ],
      };
    }
    throw new McpError(ErrorCode.InvalidParams, `Unsupported resource URI: ${uri}`);
  });

  return server;
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

async function main() {
  const config = loadConfig();
  const server = createAgentShareServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("AgentShare MCP Server failed to start:", err);
  process.exit(1);
});
