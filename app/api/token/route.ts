import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db/client";
import { generatePathwayToken, buildShareUrl, ttlSecondsFromNow } from "@/lib/utils/token";
import { auth } from "@/auth";
import { verifyApiKey } from "@/lib/auth/api-keys";
import {
  checkRateLimit,
  rateLimitKey,
  API_RATE_LIMIT,
} from "@/lib/rate-limit";

const RequestSchema = z.object({
  assetId: z.string().uuid(),
  scope: z.enum(["read", "read_write", "admin"]).default("read"),
  ttlSeconds: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  // --- Authenticate ---
  let userId: string | undefined;

  // 1. Try session auth
  const session = await auth();
  userId = session?.user?.id;

  // 2. Try API key auth
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

  const { assetId, scope, ttlSeconds } = parsed.data;

  // Confirm the asset belongs to this user before minting a token for it.
  const [asset] = await query<{ id: string }>(
    `SELECT id FROM assets WHERE id = $1 AND owner_id = $2`,
    [assetId, userId]
  );
  if (!asset) {
    return NextResponse.json({ error: "asset_not_found" }, { status: 404 });
  }

  let token = generatePathwayToken();
  // Guard against the (rare) collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const [existing] = await query<{ token: string }>(
      `SELECT token FROM pathway_tokens WHERE token = $1`,
      [token]
    );
    if (!existing) break;
    token = generatePathwayToken();
  }

  const expiresAt = ttlSecondsFromNow(ttlSeconds);

  await query(
    `INSERT INTO pathway_tokens (token, asset_id, owner_id, scope, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [token, assetId, userId, scope, expiresAt]
  );

  await query(
    `INSERT INTO audit_logs (event_type, token, asset_id, actor_user_id)
     VALUES ('token_created', $1, $2, $3)`,
    [token, assetId, userId]
  );

  return NextResponse.json({
    token,
    shareUrl: buildShareUrl(token),
    scope,
    expiresAt,
  });
}
