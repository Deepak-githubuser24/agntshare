/**
 * AgentShare MCP Server
 *
 * Exposes AgentShare's secure file/artifact sharing via the Model Context Protocol.
 * Any MCP-compatible agent (Claude, Cursor, VS Code, etc.) can use these tools to:
 *   - Share files/content by uploading and minting pathway tokens
 *   - Resolve pathway tokens to retrieve shared content
 *   - Revoke pathway tokens to destroy access
 *
 * The server acts as a thin MCP adapter over AgentShare's REST API, fully respecting
 * the security model: API key auth, token scopes, checksums, agent identity, audit logging.
 *
 * Transport: stdio (for local agent integrations like Claude Desktop)
 */

import { createHash } from 'node:crypto';

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
      'AGENTSHARE_API_KEY environment variable is required.\n' +
      'Set it before starting the MCP server:\n' +
      '  export AGENTSHARE_API_KEY=agnt_...'
    );
  }
  return {
    apiKey,
    baseUrl: process.env.AGENTSHARE_BASE_URL ?? 'http://localhost:3000/api',
    agentId: process.env.AGENTSHARE_AGENT_ID,
    sessionId: process.env.AGENTSHARE_SESSION_ID,
    agentRole: process.env.AGENTSHARE_AGENT_ROLE ?? 'mcp-server',
  };
}

// ─── HTTP Client (minimal, no external deps) ────────────────────────────────

async function apiRequest<T>(
  config: AgentShareMCPConfig,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.apiKey}`,
    'x-user-id': config.apiKey,
  };

  if (config.agentId) headers['x-agent-id'] = config.agentId;
  if (config.sessionId) headers['x-session-id'] = config.sessionId;
  if (config.agentRole) headers['x-agent-role'] = config.agentRole;

  if (body && method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errMsg = (data as Record<string, string>)?.error ?? `HTTP ${res.status}`;
    throw new Error(`AgentShare API error: ${errMsg}`);
  }

  return data as T;
}

// ─── Tool Implementations ───────────────────────────────────────────────────

interface UploadResponse { assetId: string; uploadUrl: string }
interface MintResponse { token: string; shareUrl: string; scope: string; expiresAt: string }
interface ResolveResponse {
  filename: string; contentType: string; sizeBytes: number;
  scope: string; streamUrl: string; checksumSha256?: string | null;
}
interface RevokeResponse { success: boolean; token: string; revokedAt: string }

async function toolShare(
  config: AgentShareMCPConfig,
  args: { filename: string; content: string; contentType?: string; scope?: string; ttlSeconds?: number }
) {
  const content = args.content;
  const contentType = args.contentType ?? 'text/plain';
  const contentBytes = Buffer.from(content, 'utf-8');
  const checksumSha256 = createHash('sha256').update(contentBytes).digest('hex');

  // 1. Initialize upload
  const upload = await apiRequest<UploadResponse>(config, 'POST', '/upload', {
    filename: args.filename,
    contentType,
    sizeBytes: contentBytes.byteLength,
    checksumSha256,
  });

  // 2. PUT content directly to presigned S3 URL
  const putRes = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: contentBytes,
  });

  if (!putRes.ok) {
    throw new Error(`Storage upload failed: HTTP ${putRes.status}`);
  }

  // 3. Mint pathway token
  const mint = await apiRequest<MintResponse>(config, 'POST', '/token', {
    assetId: upload.assetId,
    scope: args.scope ?? 'read',
    ...(args.ttlSeconds ? { ttlSeconds: args.ttlSeconds } : {}),
  });

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        token: mint.token,
        shareUrl: mint.shareUrl,
        assetId: upload.assetId,
        scope: mint.scope,
        expiresAt: mint.expiresAt,
        checksumSha256,
        filename: args.filename,
      }, null, 2),
    }],
  };
}

async function toolResolve(
  config: AgentShareMCPConfig,
  args: { token: string; intent?: string }
) {
  const intentQuery = args.intent ? `?intent=${args.intent}` : '';
  const resolved = await apiRequest<ResolveResponse>(config, 'GET', `/resolve/${args.token}${intentQuery}`);

  // Fetch the actual file content
  const fileRes = await fetch(resolved.streamUrl);
  if (!fileRes.ok) {
    throw new Error(`Failed to fetch file from storage: HTTP ${fileRes.status}`);
  }

  const fileContent = await fileRes.text();

  // Verify checksum if available
  let checksumValid: boolean | null = null;
  if (resolved.checksumSha256) {
    const actualHash = createHash('sha256').update(Buffer.from(fileContent, 'utf-8')).digest('hex');
    checksumValid = actualHash.toLowerCase() === resolved.checksumSha256.toLowerCase();
  }

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        filename: resolved.filename,
        contentType: resolved.contentType,
        sizeBytes: resolved.sizeBytes,
        scope: resolved.scope,
        checksumSha256: resolved.checksumSha256,
        checksumValid,
        content: fileContent,
      }, null, 2),
    }],
  };
}

async function toolRevoke(
  config: AgentShareMCPConfig,
  args: { token: string }
) {
  const result = await apiRequest<RevokeResponse>(config, 'DELETE', `/token/${args.token}`);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: result.success,
        token: result.token,
        revokedAt: result.revokedAt,
      }, null, 2),
    }],
  };
}

// ─── MCP Server Setup & Registration ────────────────────────────────────────

export function createAgentShareServer(config: AgentShareMCPConfig) {
  // Dynamic import to work with ESM
  return import('@modelcontextprotocol/server').then(({ McpServer }) =>
    import('zod/v4').then((z) => {
      const server = new McpServer({
        name: 'agentshare',
        version: '1.0.0',
      });

      // ── Tool: agentshare_share ──────────────────────────────────────
      server.registerTool(
        'agentshare_share',
        {
          description:
            'Upload content to AgentShare and mint a short pathway token. ' +
            'Use this when you need to share a file, code snippet, analysis result, or any text artifact ' +
            'with another agent or user. Returns a pathway token that anyone can use to retrieve the content. ' +
            'Every upload is checksummed for integrity and every access is audited.',
          inputSchema: z.object({
            filename: z.string().describe('Name for the shared file, e.g. "report.json" or "analysis.md"'),
            content: z.string().describe('The text content to share'),
            contentType: z.string().optional().describe('MIME type, defaults to "text/plain". Use "application/json" for JSON, "text/markdown" for markdown, etc.'),
            scope: z.enum(['read', 'read_write', 'admin']).optional().describe('Access scope for the pathway token. Defaults to "read"'),
            ttlSeconds: z.number().optional().describe('Time-to-live in seconds for the pathway token. Defaults to 24 hours'),
          }),
        },
        async (args) => toolShare(config, args)
      );

      // ── Tool: agentshare_resolve ────────────────────────────────────
      server.registerTool(
        'agentshare_resolve',
        {
          description:
            'Resolve a pathway token to retrieve shared content from AgentShare. ' +
            'Use this when you receive a pathway token (short string like "x97b") and need to read the shared file. ' +
            'Automatically verifies the SHA-256 checksum if one was provided during upload. ' +
            'Access is audited — every resolve is logged with agent identity and timestamp.',
          inputSchema: z.object({
            token: z.string().describe('The pathway token to resolve, e.g. "x97b"'),
            intent: z.enum(['read', 'write']).optional().describe('Access intent. Use "write" only if you need to update the file and have read_write scope'),
          }),
        },
        async (args) => toolResolve(config, args)
      );

      // ── Tool: agentshare_revoke ─────────────────────────────────────
      server.registerTool(
        'agentshare_revoke',
        {
          description:
            'Revoke a pathway token to permanently destroy access. ' +
            'Use this when a shared artifact is no longer needed, or to enforce least-privilege by revoking tokens after a handoff is complete. ' +
            'Revoked tokens cannot be resolved and will return an error.',
          inputSchema: z.object({
            token: z.string().describe('The pathway token to revoke'),
          }),
        },
        async (args) => toolRevoke(config, args)
      );

      // ── Resource: agentshare://token/{id} ───────────────────────────
      server.registerResourceTemplate(
        'agentshare://token/{token}',
        {
          description: 'Read the content of a shared artifact by its pathway token',
          mimeType: 'text/plain',
        },
        async (uri, { token }) => {
          const resolved = await apiRequest<ResolveResponse>(config, 'GET', `/resolve/${token}`);
          const fileRes = await fetch(resolved.streamUrl);
          if (!fileRes.ok) {
            throw new Error(`Failed to fetch file: HTTP ${fileRes.status}`);
          }
          const content = await fileRes.text();
          return {
            contents: [{
              uri: uri.href,
              text: content,
              mimeType: resolved.contentType ?? 'text/plain',
            }],
          };
        }
      );

      return server;
    })
  );
}

// ─── Entry Point (stdio transport) ──────────────────────────────────────────

async function main() {
  const config = loadConfig();

  const server = await createAgentShareServer(config);

  const { serveStdio } = await import('@modelcontextprotocol/server/stdio');
  await serveStdio(server);
}

main().catch((err) => {
  console.error('AgentShare MCP Server failed to start:', err.message);
  process.exit(1);
});
