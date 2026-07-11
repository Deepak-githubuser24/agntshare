import { AgentShare } from "@agentshare/sdk";
export declare function createAgentShareTool(client: AgentShare): import("ai").Tool<{
    action: "share" | "resolve";
    contentType: string;
    filename?: string | undefined;
    content?: string | undefined;
    token?: string | undefined;
}, {
    success: boolean;
    message: string;
    token: string;
    shareUrl: string;
    error?: undefined;
    filename?: undefined;
    contentType?: undefined;
    content?: undefined;
} | {
    success: boolean;
    error: any;
    message?: undefined;
    token?: undefined;
    shareUrl?: undefined;
    filename?: undefined;
    contentType?: undefined;
    content?: undefined;
} | {
    success: boolean;
    filename: string;
    contentType: string;
    content: string;
    message?: undefined;
    token?: undefined;
    shareUrl?: undefined;
    error?: undefined;
} | undefined>;
