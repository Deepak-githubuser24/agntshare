/**
 * AgentShare MCP Server
 *
 * Exposes AgentShare's secure file/artifact sharing via the Model Context Protocol.
 * Built using the official `@modelcontextprotocol/sdk`.
 *
 * Exposes 3 core tools:
 *   - `agentshare_share`: Upload content and mint a short pathway token
 *   - `agentshare_resolve`: Resolve a pathway token to retrieve shared content & verify checksum
 *   - `agentshare_revoke`: Revoke a pathway token to permanently destroy access
 *
 * Exposes 1 resource:
 *   - `agentshare://token/{token}`: Read shared content directly via resource URI
 *
 * Transport: stdio (for local agent integrations like Claude Desktop / Cursor)
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
export interface AgentShareMCPConfig {
    apiKey: string;
    baseUrl?: string;
    agentId?: string;
    sessionId?: string;
    agentRole?: string;
}
export declare function createAgentShareServer(config: AgentShareMCPConfig): Server;
