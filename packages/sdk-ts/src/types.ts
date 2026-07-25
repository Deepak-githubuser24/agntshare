export interface UploadOptions {
  filename: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256?: string;
}

export interface UploadResponse {
  assetId: string;
  uploadUrl: string;
}

export interface MintTokenOptions {
  assetId: string;
  scope?: "read" | "read_write" | "admin";
  ttlSeconds?: number;
}

export interface MintTokenResponse {
  token: string;
  shareUrl: string;
  scope: string;
  expiresAt: string;
}

export interface ResolveOptions {
  intent?: "read" | "write";
}

export interface ResolveTokenResponse {
  filename: string;
  contentType: string;
  sizeBytes: number;
  scope: string;
  streamUrl: string;
  checksumSha256?: string | null;
  uploadUrl?: string;
}

export interface RevokeTokenResponse {
  success: boolean;
  token: string;
  revokedAt: string;
}

export interface AgentShareConfig {
  apiKey?: string;
  baseUrl?: string;
  agentId?: string;
  sessionId?: string;
  agentRole?: string;
}

export class AgentShareError extends Error {
  public status?: number;
  public details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = "AgentShareError";
    this.status = status;
    this.details = details;
  }
}
