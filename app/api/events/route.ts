import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";
import { auth } from "@/auth";
import { verifyApiKey } from "@/lib/auth/api-keys";

const MAX_PROPERTIES_BYTES = 10_240; // 10 KB max
const MAX_NESTING_DEPTH = 3;

function checkDepth(obj: unknown, current = 0): boolean {
  if (current > MAX_NESTING_DEPTH) return false;
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    return Object.values(obj).every((v) => checkDepth(v, current + 1));
  }
  if (Array.isArray(obj)) {
    return obj.every((v) => checkDepth(v, current + 1));
  }
  return true;
}

export async function POST(req: NextRequest) {
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

  // --- Parse body ---
  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_PROPERTIES_BYTES) {
      return NextResponse.json(
        { error: "payload_too_large", maxBytes: MAX_PROPERTIES_BYTES },
        { status: 413 }
      );
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { event, properties } = body as { event?: string; properties?: unknown };

  if (!event || typeof event !== "string" || event.length > 100) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  // --- Validate properties ---
  const safeProperties = properties ?? {};
  if (!checkDepth(safeProperties)) {
    return NextResponse.json(
      { error: "properties_too_deeply_nested", maxDepth: MAX_NESTING_DEPTH },
      { status: 400 }
    );
  }

  // --- Write to analytics_events (NOT audit_logs) ---
  try {
    await query(
      `INSERT INTO analytics_events (event_type, actor_user_id, properties)
       VALUES ($1, $2, $3)`,
      [event, userId, JSON.stringify(safeProperties)]
    );
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "internal_error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
