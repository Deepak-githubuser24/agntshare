import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db/client";
import { generatePathwayToken, buildShareUrl, ttlSecondsFromNow } from "@/lib/utils/token";

const RequestSchema = z.object({
  assetId: z.string().uuid(),
  scope: z.enum(["read", "read_write", "admin"]).default("read"),
  ttlSeconds: z.number().int().positive().optional(),
});

import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  let userId = session?.user?.id;
  const authHeader = req.headers.get("Authorization");

  if (!userId && authHeader?.startsWith("Bearer ")) {
    const key = authHeader.replace("Bearer ", "");
    let users = await query<{ id: string }>("SELECT id FROM users WHERE email = $1", [`api-${key}@example.com`]);
    if (users.length === 0) {
      await query("INSERT INTO users (email, auth_provider) VALUES ($1, $2)", [`api-${key}@example.com`, "api_key"]);
      users = await query<{ id: string }>("SELECT id FROM users WHERE email = $1", [`api-${key}@example.com`]);
    }
    userId = users[0].id;
  }

  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

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
