import {
  UploadOptions,
  UploadResponse,
  MintTokenOptions,
  MintTokenResponse,
  ResolveOptions,
  ResolveTokenResponse,
  RevokeTokenResponse,
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
      headers.set("x-user-id", this.apiKey);
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
      throw new AgentShareError(
        errorData?.error || `Request failed with status ${res.status}`,
        res.status,
        errorData?.details
      );
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
   * Pass options.intent = "write" if you have read_write scope and need an uploadUrl to update the asset.
   */
  async resolve(token: string, options?: ResolveOptions): Promise<ResolveTokenResponse> {
    const intentQuery = options?.intent ? `?intent=${options.intent}` : "";
    return this.fetch<ResolveTokenResponse>(`/resolve/${token}${intentQuery}`, {
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
   * Helper utility to verify the SHA-256 checksum of raw data against an expected hex digest.
   */
  static async verifyChecksum(data: string | Uint8Array, expectedSha256: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    
    // In Node or Browser with Web Crypto API
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const actualHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      return actualHex.toLowerCase() === expectedSha256.toLowerCase();
    }
    return false;
  }
}
