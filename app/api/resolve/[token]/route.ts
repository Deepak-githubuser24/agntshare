import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";
import { getDownloadUrl } from "@/lib/storage/s3";

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
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

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

  const [asset] = await query<AssetRow>(
    `SELECT id, storage_key, filename, content_type, size_bytes
     FROM assets WHERE id = $1`,
    [pathwayToken.asset_id]
  );
  if (!asset) {
    return NextResponse.json({ error: "asset_not_found" }, { status: 404 });
  }

  const streamUrl = await getDownloadUrl(asset.storage_key);

  await query(
    `INSERT INTO audit_logs (event_type, token, asset_id, ip_address)
     VALUES ('token_resolved', $1, $2, $3)`,
    [token, asset.id, ip]
  );

  return NextResponse.json({
    filename: asset.filename,
    contentType: asset.content_type,
    sizeBytes: asset.size_bytes,
    scope: pathwayToken.scope,
    streamUrl, // presigned, byte-range-capable GET URL — client streams directly from storage
  });
}
