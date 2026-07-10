import { tool } from "ai";
import { z } from "zod";
import { AgentShare } from "@agentshare/sdk";

export function createAgentShareTool(client: AgentShare) {
  return tool({
    description: "Use this tool to share text or files securely by uploading them to AgentShare and generating a short pathway token, OR to resolve an existing token back into text content.",
    parameters: z.discriminatedUnion("action", [
      z.object({
        action: z.literal("share"),
        filename: z.string().describe("The name of the file to create (e.g. 'summary.txt', 'data.json')"),
        content: z.string().describe("The raw text content to write to the file"),
        contentType: z.string().default("text/plain").describe("The MIME type of the file"),
      }),
      z.object({
        action: z.literal("resolve"),
        token: z.string().describe("The short pathway token to resolve (e.g., 'x97b')"),
      }),
    ]),
    execute: async (args) => {
      if (args.action === "share") {
        try {
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
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }

      if (args.action === "resolve") {
        try {
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
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }
    },
  });
}
