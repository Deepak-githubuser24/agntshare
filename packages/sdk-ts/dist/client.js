"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentShare = void 0;
const types_1 = require("./types");
class AgentShare {
    apiKey;
    baseUrl;
    constructor(config) {
        // Allows setting via env var or explicit config
        this.apiKey = config?.apiKey || process.env.AGENTSHARE_API_KEY || "";
        this.baseUrl = config?.baseUrl || process.env.AGENTSHARE_BASE_URL || "http://localhost:3000/api";
    }
    async fetch(path, options = {}) {
        const headers = new Headers(options.headers);
        if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "HEAD") {
            headers.set("Content-Type", "application/json");
        }
        // For local testing MVP, auth is assumed via session or headers, but we standardise on Authorization
        if (this.apiKey) {
            headers.set("Authorization", `Bearer ${this.apiKey}`);
            // Fallback for current local MVP endpoints which use custom headers
            headers.set("x-user-id", this.apiKey);
        }
        const res = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers,
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            throw new types_1.AgentShareError(errorData?.error || `Request failed with status ${res.status}`, res.status, errorData?.details);
        }
        return res.json();
    }
    /**
     * Step 1: Initialize an upload and get a presigned URL.
     * After calling this, you must PUT the file directly to `response.uploadUrl`.
     */
    async upload(options) {
        return this.fetch("/upload", {
            method: "POST",
            body: JSON.stringify(options),
        });
    }
    /**
     * Step 2: Mint a short pathway token for an uploaded asset.
     */
    async mintToken(options) {
        return this.fetch("/token", {
            method: "POST",
            body: JSON.stringify(options),
        });
    }
    /**
     * Step 3: Resolve a token into a secure, presigned stream URL.
     */
    async resolve(token) {
        return this.fetch(`/resolve/${token}`, {
            method: "GET",
        });
    }
}
exports.AgentShare = AgentShare;
