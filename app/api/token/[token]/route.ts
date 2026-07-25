import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";
import { auth } from "@/auth";
import { verifyApiKey } from "@/lib/auth/api-keys";

type PathwayTokenRow = {
  token: string;
  asset_id: string;
  owner_id: string;
  scope: string;
  revoked_at: string | null;
};

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // --- Authenticate ---
  let userId: string | undefined;

  const session = await auth();
  userId = session?.user?.id;

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

  const [pathwayToken] = await query<PathwayTokenRow>(
    `SELECT token, asset_id, owner_id, scope, revoked_at
     FROM pathway_tokens WHERE token = $1`,
    [token]
  );

  if (!pathwayToken) {
    return NextResponse.json({ error: "token_not_found" }, { status: 404 });
  }

  // Confirm authorization: must be token owner or asset owner
  if (pathwayToken.owner_id !== userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  if (pathwayToken.revoked_at) {
    return NextResponse.json({ error: "token_already_revoked", revokedAt: pathwayToken.revoked_at }, { status: 400 });
  }

  const revokedAt = new Date().toISOString();

  await query(
    `UPDATE pathway_tokens SET revoked_at = $1 WHERE token = $2`,
    [revokedAt, token]
  );

  await query(
    `INSERT INTO audit_logs (event_type, token, asset_id, actor_user_id, agent_id, session_id, agent_role)
     VALUES ('token_revoked', $1, $2, $3, $4, $5, $6)`,
    [token, pathwayToken.asset_id, userId, agentId ?? null, sessionId ?? null, agentRole ?? null]
  );

  return NextResponse.json({
    success: true,
    token,
    revokedAt,
  });
}
