import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";
import { getDownloadUrl, getUploadUrl } from "@/lib/storage/s3";

type PathwayTokenRow = {
  token: string;
  asset_id: string;
  scope: string;
  expires_at: string;
  revoked_at: string | null;
};

type AssetRow = {
  id: string;
  storage_key: string;
  filename: string;
  content_type: string | null;
  size_bytes: number | null;
  checksum_sha256: string | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  // --- Extract Agent Identity ---
  const agentId = req.headers.get("x-agent-id") ?? undefined;
  const sessionId = req.headers.get("x-session-id") ?? undefined;
  const agentRole = req.headers.get("x-agent-role") ?? undefined;

  // --- Extract Intent & Selective Retrieval Parameters ---
  const { searchParams } = new URL(req.url);
  const intent = searchParams.get("intent") ?? "read";
  const keysParam = searchParams.get("keys");
  const pathParam = searchParams.get("path");
  const keys = keysParam ? keysParam.split(",").map((k) => k.trim()) : undefined;

  const [pathwayToken] = await query<PathwayTokenRow>(
    `SELECT token, asset_id, scope, expires_at, revoked_at
     FROM pathway_tokens WHERE token = $1`,
    [token]
  );

  if (!pathwayToken) {
    return NextResponse.json({ error: "token_not_found" }, { status: 404 });
  }
  if (pathwayToken.revoked_at) {
    return NextResponse.json({ error: "token_revoked" }, { status: 410 });
  }
  if (new Date(pathwayToken.expires_at) < new Date()) {
    return NextResponse.json({ error: "token_expired" }, { status: 410 });
  }

  // --- Scope Enforcement ---
  if (intent === "write" && pathwayToken.scope !== "read_write" && pathwayToken.scope !== "admin") {
    return NextResponse.json(
      { error: "insufficient_scope", scope: pathwayToken.scope, requiredScope: "read_write" },
      { status: 403 }
    );
  }

  const [asset] = await query<AssetRow>(
    `SELECT id, storage_key, filename, content_type, size_bytes, checksum_sha256
     FROM assets WHERE id = $1`,
    [pathwayToken.asset_id]
  );
  if (!asset) {
    return NextResponse.json({ error: "asset_not_found" }, { status: 404 });
  }

  const streamUrl = await getDownloadUrl(asset.storage_key);
  let uploadUrl: string | undefined;

  if (intent === "write" || pathwayToken.scope === "read_write" || pathwayToken.scope === "admin") {
    uploadUrl = await getUploadUrl(asset.storage_key, asset.content_type ?? "application/octet-stream");
  }

  await query(
    `INSERT INTO audit_logs (event_type, token, asset_id, ip_address, agent_id, session_id, agent_role, metadata)
     VALUES ('token_resolved', $1, $2, $3, $4, $5, $6, $7)`,
    [
      token,
      asset.id,
      ip,
      agentId ?? null,
      sessionId ?? null,
      agentRole ?? null,
      JSON.stringify({ intent, scope: pathwayToken.scope, selectiveKeys: keys ?? null, selectivePath: pathParam ?? null }),
    ]
  );

  return NextResponse.json({
    filename: asset.filename,
    contentType: asset.content_type,
    sizeBytes: asset.size_bytes,
    checksumSha256: asset.checksum_sha256,
    scope: pathwayToken.scope,
    streamUrl,
    ...(uploadUrl ? { uploadUrl } : {}),
  });
}
