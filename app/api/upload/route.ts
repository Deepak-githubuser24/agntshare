import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db/client";
import { getUploadUrl } from "@/lib/storage/s3";
import { auth } from "@/auth";
import { verifyApiKey } from "@/lib/auth/api-keys";
import {
  checkRateLimit,
  rateLimitKey,
  API_RATE_LIMIT,
} from "@/lib/rate-limit";

const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500MB — tune as needed

const RequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(MAX_SIZE_BYTES),
  checksumSha256: z.string().length(64).regex(/^[a-fA-F0-9]{64}$/).optional(),
});

export async function POST(req: NextRequest) {
  // --- Authenticate ---
  let userId: string | undefined;

  // 1. Try session auth (browser / cookie-based)
  const session = await auth();
  userId = session?.user?.id;

  // 2. Try API key auth (Bearer token)
  if (!userId) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const rawKey = authHeader.slice(7);
      const keyUserId = await verifyApiKey(rawKey);
      if (keyUserId) {
        userId = keyUserId;
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // --- Extract Agent Identity ---
  const agentId = req.headers.get("x-agent-id") ?? undefined;
  const sessionId = req.headers.get("x-session-id") ?? undefined;
  const agentRole = req.headers.get("x-agent-role") ?? undefined;

  // --- Rate limit ---
  const rlKey = rateLimitKey(req, userId);
  const rl = checkRateLimit(rlKey, API_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limit_exceeded", retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000) },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  // --- Validate body ---
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { filename, contentType, sizeBytes, checksumSha256 } = parsed.data;
  const storageKey = `${userId}/${crypto.randomUUID()}-${filename}`;

  const [asset] = await query<{ id: string }>(
    `INSERT INTO assets (owner_id, storage_key, filename, content_type, size_bytes, checksum_sha256)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [userId, storageKey, filename, contentType, sizeBytes, checksumSha256 ?? null]
  );

  const uploadUrl = await getUploadUrl(storageKey, contentType);

  await query(
    `INSERT INTO audit_logs (event_type, asset_id, actor_user_id, agent_id, session_id, agent_role, metadata)
     VALUES ('upload', $1, $2, $3, $4, $5, $6)`,
    [asset.id, userId, agentId ?? null, sessionId ?? null, agentRole ?? null, JSON.stringify({ filename, sizeBytes, checksumSha256 })]
  );

  return NextResponse.json({ assetId: asset.id, uploadUrl });
}
