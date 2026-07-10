import { UploadOptions, UploadResponse, MintTokenOptions, MintTokenResponse, ResolveTokenResponse } from "./types";
export interface AgentShareConfig {
    apiKey?: string;
    baseUrl?: string;
}
export declare class AgentShare {
    private apiKey;
    private baseUrl;
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
     */
    resolve(token: string): Promise<ResolveTokenResponse>;
}
