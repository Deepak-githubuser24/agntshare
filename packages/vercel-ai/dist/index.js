"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentShareTool = createAgentShareTool;
const ai_1 = require("ai");
const zod_1 = require("zod");
const toolParameters = zod_1.z.object({
    action: zod_1.z.enum(["share", "resolve"]).describe("Whether to share a file or resolve a token"),
    filename: zod_1.z.string().optional().describe("The name of the file to create (if sharing)"),
    content: zod_1.z.string().optional().describe("The raw text content to write to the file (if sharing)"),
    contentType: zod_1.z.string().default("text/plain").describe("The MIME type of the file (if sharing)"),
    token: zod_1.z.string().optional().describe("The short pathway token to resolve (if resolving)"),
});
function createAgentShareTool(client) {
    return (0, ai_1.tool)({
        description: "Use this tool to share text or files securely by uploading them to AgentShare and generating a short pathway token, OR to resolve an existing token back into text content.",
        parameters: toolParameters,
        // @ts-ignore
        execute: async (args) => {
            if (args.action === "share") {
                try {
                    if (!args.filename || !args.content) {
                        throw new Error("Missing filename or content for share action");
                    }
                    // 1. Initialize upload
                    const { uploadUrl, assetId } = await client.upload({
                        filename: args.filename,
                        contentType: args.contentType,
                        sizeBytes: Buffer.byteLength(args.content),
                    });
                    // 2. Upload to storage
                    const uploadRes = await fetch(uploadUrl, {
                        method: "PUT",
                        headers: { "Content-Type": args.contentType },
                        body: args.content,
                    });
                    if (!uploadRes.ok) {
                        throw new Error(`Storage upload failed with status ${uploadRes.status}`);
                    }
                    // 3. Mint token
                    const { token, shareUrl } = await client.mintToken({ assetId });
                    return {
                        success: true,
                        message: `Successfully uploaded ${args.filename}.`,
                        token,
                        shareUrl,
                    };
                }
                catch (error) {
                    return { success: false, error: error.message };
                }
            }
            if (args.action === "resolve") {
                try {
                    if (!args.token) {
                        throw new Error("Missing token for resolve action");
                    }
                    // 1. Resolve token to get stream URL
                    const { streamUrl, filename, contentType } = await client.resolve(args.token);
                    // 2. Fetch the actual content
                    const fetchRes = await fetch(streamUrl);
                    if (!fetchRes.ok) {
                        throw new Error(`Failed to fetch file content from storage: ${fetchRes.statusText}`);
                    }
                    const content = await fetchRes.text();
                    return {
                        success: true,
                        filename,
                        contentType,
                        content,
                    };
                }
                catch (error) {
                    return { success: false, error: error.message };
                }
            }
        },
    });
}
