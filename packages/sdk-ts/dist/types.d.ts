export interface UploadOptions {
    filename: string;
    contentType: string;
    sizeBytes: number;
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
export interface ResolveTokenResponse {
    filename: string;
    contentType: string;
    sizeBytes: number;
    scope: string;
    streamUrl: string;
}
export declare class AgentShareError extends Error {
    status?: number;
    details?: any;
    constructor(message: string, status?: number, details?: any);
}
