import { AgentShare } from "./src";

async function run() {
  const client = new AgentShare({
    apiKey: "test-user-id",
    baseUrl: "http://localhost:3000/api",
  });

  try {
    console.log("1. Initializing upload...");
    const fileContent = "Hello, AgentShare!";
    const { uploadUrl, assetId } = await client.upload({
      filename: "hello.txt",
      contentType: "text/plain",
      sizeBytes: Buffer.byteLength(fileContent),
    });
    console.log(`Asset ID: ${assetId}`);

    console.log("2. Uploading file to storage...");
    const s3Res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: fileContent,
    });
    if (!s3Res.ok) throw new Error("S3 Upload Failed");

    console.log("3. Minting token...");
    const { token, shareUrl } = await client.mintToken({ assetId, scope: "read" });
    console.log(`Success! Token minted: ${token}`);
    console.log(`Share URL: ${shareUrl}`);

    console.log("4. Resolving token...");
    const resolveData = await client.resolve(token);
    console.log(`Resolved! Secure stream URL: ${resolveData.streamUrl.substring(0, 50)}...`);

  } catch (error) {
    console.error("SDK Flow failed:", error);
  }
}

run();
