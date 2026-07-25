import {
  UploadOptions,
  UploadResponse,
  MintTokenOptions,
  MintTokenResponse,
  ResolveOptions,
  ResolveTokenResponse,
  RevokeTokenResponse,
  ShareStateOptions,
  ShareStateResponse,
  AgentShareConfig,
  AgentShareError,
} from "./types";

export class AgentShare {
  private apiKey: string;
  private baseUrl: string;
  private agentId?: string;
  private sessionId?: string;
  private agentRole?: string;

  constructor(config?: AgentShareConfig) {
    this.apiKey = config?.apiKey || (typeof process !== "undefined" ? process.env?.AGENTSHARE_API_KEY : "") || "";
    this.baseUrl = config?.baseUrl || (typeof process !== "undefined" ? process.env?.AGENTSHARE_BASE_URL : "") || "http://localhost:3000/api";
    this.agentId = config?.agentId;
    this.sessionId = config?.sessionId;
    this.agentRole = config?.agentRole;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "HEAD" && options.method !== "DELETE") {
      headers.set("Content-Type", "application/json");
    }
    
    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }

    if (this.agentId) headers.set("x-agent-id", this.agentId);
    if (this.sessionId) headers.set("x-session-id", this.sessionId);
    if (this.agentRole) headers.set("x-agent-role", this.agentRole);

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const rawError = errorData?.error || `HTTP ${res.status}`;
      let message = `[AgentShare Error ${res.status}] ${rawError}`;

      if (res.status === 401) {
        message += " — Unauthenticated. Verify your AGENTSHARE_API_KEY environment variable or config.";
      } else if (res.status === 403) {
        message += " — Forbidden. Insufficient scope or token owner mismatch. Ensure token has required scope (e.g. read_write for intent=write).";
      } else if (res.status === 404) {
        message += " — Not Found. The requested pathway token or asset ID does not exist.";
      } else if (res.status === 410) {
        message += " — Token Inactive. This pathway token has expired or was explicitly revoked.";
      } else if (res.status === 429) {
        message += " — Rate Limit Exceeded. Too many requests in window. Please wait before retrying.";
      }

      throw new AgentShareError(message, res.status, errorData?.details ?? errorData);
    }

    return res.json();
  }

  /**
   * Step 1: Initialize an upload and get a presigned URL.
   * After calling this, you must PUT the file directly to `response.uploadUrl`.
   */
  async upload(options: UploadOptions): Promise<UploadResponse> {
    return this.fetch<UploadResponse>("/upload", {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  /**
   * Step 2: Mint a short pathway token for an uploaded asset.
   */
  async mintToken(options: MintTokenOptions): Promise<MintTokenResponse> {
    return this.fetch<MintTokenResponse>("/token", {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  /**
   * Step 3: Resolve a token into a secure, presigned stream URL.
   * Supports optional intent ("read" | "write"), selective keys, or dot-notation path.
   */
  async resolve(token: string, options?: ResolveOptions): Promise<ResolveTokenResponse> {
    const queryParams = new URLSearchParams();
    if (options?.intent) queryParams.set("intent", options.intent);
    if (options?.keys && options.keys.length > 0) queryParams.set("keys", options.keys.join(","));
    if (options?.path) queryParams.set("path", options.path);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.fetch<ResolveTokenResponse>(`/resolve/${token}${queryString}`, {
      method: "GET",
    });
  }

  /**
   * Revoke an active pathway token immediately.
   */
  async revokeToken(token: string): Promise<RevokeTokenResponse> {
    return this.fetch<RevokeTokenResponse>(`/token/${token}`, {
      method: "DELETE",
    });
  }

  /**
   * High-level helper: Share structured agent memory / project state.
   * Serializes the object, computes SHA-256 checksum, uploads to S3, and mints a pathway token.
   */
  async shareState(options: ShareStateOptions): Promise<ShareStateResponse> {
    const filename = options.filename ?? `state-${Date.now()}.json`;
    const content = JSON.stringify(options.state, null, 2);
    const contentBytes = typeof TextEncoder !== "undefined" 
      ? new TextEncoder().encode(content) 
      : Buffer.from(content, "utf-8");

    // Compute checksum
    let checksumSha256 = "";
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest("SHA-256", contentBytes.buffer as ArrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      checksumSha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    // 1. Initialize upload
    const { uploadUrl, assetId } = await this.upload({
      filename,
      contentType: "application/json",
      sizeBytes: contentBytes.byteLength,
      checksumSha256: checksumSha256 || undefined,
    });

    // 2. PUT directly to presigned URL
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: content,
    });

    if (!putRes.ok) {
      throw new AgentShareError(`Failed to upload state payload to S3: HTTP ${putRes.status}`);
    }

    // 3. Mint token
    const mint = await this.mintToken({
      assetId,
      scope: options.scope ?? "read",
      ttlSeconds: options.ttlSeconds,
    });

    return {
      token: mint.token,
      shareUrl: mint.shareUrl,
      assetId,
      checksumSha256,
      scope: mint.scope,
      expiresAt: mint.expiresAt,
    };
  }

  /**
   * High-level helper: Resolve a token and parse its JSON memory/state content.
   * Supports selective retrieval by `keys` or dot-notation `path`.
   */
  async resolveState<T = any>(
    token: string,
    options?: ResolveOptions
  ): Promise<{
    filename: string;
    contentType: string;
    scope: string;
    checksumSha256?: string | null;
    checksumValid?: boolean;
    state: T;
  }> {
    const resolved = await this.resolve(token, options);
    const fileRes = await fetch(resolved.streamUrl);
    
    if (!fileRes.ok) {
      throw new AgentShareError(`Failed to download state payload: HTTP ${fileRes.status}`);
    }

    const rawText = await fileRes.text();

    // Verify checksum if present
    let checksumValid: boolean | undefined;
    if (resolved.checksumSha256) {
      checksumValid = await AgentShare.verifyChecksum(rawText, resolved.checksumSha256);
    }

    const fullObj = JSON.parse(rawText);
    const selectedState = AgentShare.selectFromJSON(fullObj, options?.keys, options?.path);

    return {
      filename: resolved.filename,
      contentType: resolved.contentType,
      scope: resolved.scope,
      checksumSha256: resolved.checksumSha256,
      checksumValid,
      state: selectedState as T,
    };
  }

  /**
   * Helper utility to perform selective extraction on JSON data.
   * Accepts top-level or array of keys (e.g. ["summary", "decisions"]) or dot-notation path (e.g. "memory.database").
   */
  static selectFromJSON(data: any, keys?: string[], path?: string): any {
    if (!data || typeof data !== "object") return data;

    // Handle dot-notation path (e.g. "memory.database")
    if (path) {
      const parts = path.split(".");
      let current = data;
      for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
      }
      return current;
    }

    // Handle top-level keys filter (e.g. ["summary", "decisions"])
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

  /**
   * Helper utility to verify the SHA-256 checksum of raw data against an expected hex digest.
   */
  static async verifyChecksum(data: string | Uint8Array, expectedSha256: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest("SHA-256", bytes.buffer as ArrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const actualHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      return actualHex.toLowerCase() === expectedSha256.toLowerCase();
    }
    return false;
  }
}
