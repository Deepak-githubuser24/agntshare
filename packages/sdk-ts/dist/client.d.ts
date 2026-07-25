import { UploadOptions, UploadResponse, MintTokenOptions, MintTokenResponse, ResolveOptions, ResolveTokenResponse, RevokeTokenResponse, ShareStateOptions, ShareStateResponse, AgentShareConfig } from "./types";
export declare class AgentShare {
    private apiKey;
    private baseUrl;
    private agentId?;
    private sessionId?;
    private agentRole?;
    constructor(config?: AgentShareConfig);
    private fetch;
    /**
     * Step 1: Initialize an upload and get a presigned URL.
     * After calling this, you must PUT the file directly to `response.uploadUrl`.
     */
    upload(options: UploadOptions): Promise<UploadResponse>;
    /**
     * Step 2: Mint a short pathway token for an uploaded asset.
     */
    mintToken(options: MintTokenOptions): Promise<MintTokenResponse>;
    /**
     * Step 3: Resolve a token into a secure, presigned stream URL.
     * Supports optional intent ("read" | "write"), selective keys, or dot-notation path.
     */
    resolve(token: string, options?: ResolveOptions): Promise<ResolveTokenResponse>;
    /**
     * Revoke an active pathway token immediately.
     */
    revokeToken(token: string): Promise<RevokeTokenResponse>;
    /**
     * High-level helper: Share structured agent memory / project state.
     * Serializes the object, computes SHA-256 checksum, uploads to S3, and mints a pathway token.
     */
    shareState(options: ShareStateOptions): Promise<ShareStateResponse>;
    /**
     * High-level helper: Resolve a token and parse its JSON memory/state content.
     * Supports selective retrieval by `keys` or dot-notation `path`.
     */
    resolveState<T = any>(token: string, options?: ResolveOptions): Promise<{
        filename: string;
        contentType: string;
        scope: string;
        checksumSha256?: string | null;
        checksumValid?: boolean;
        state: T;
    }>;
    /**
     * Helper utility to perform selective extraction on JSON data.
     * Accepts top-level or array of keys (e.g. ["summary", "decisions"]) or dot-notation path (e.g. "memory.database").
     */
    static selectFromJSON(data: any, keys?: string[], path?: string): any;
    /**
     * Helper utility to verify the SHA-256 checksum of raw data against an expected hex digest.
     */
    static verifyChecksum(data: string | Uint8Array, expectedSha256: string): Promise<boolean>;
}
