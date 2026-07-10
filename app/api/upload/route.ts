import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db/client";
import { getUploadUrl } from "@/lib/storage/s3";

const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500MB — tune as needed

const RequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(MAX_SIZE_BYTES),
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

  const { filename, contentType, sizeBytes } = parsed.data;
  const storageKey = `${userId}/${crypto.randomUUID()}-${filename}`;

  const [asset] = await query<{ id: string }>(
    `INSERT INTO assets (owner_id, storage_key, filename, content_type, size_bytes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, storageKey, filename, contentType, sizeBytes]
  );

  const uploadUrl = await getUploadUrl(storageKey, contentType);

  await query(
    `INSERT INTO audit_logs (event_type, asset_id, actor_user_id, metadata)
     VALUES ('upload', $1, $2, $3)`,
    [asset.id, userId, JSON.stringify({ filename, sizeBytes })]
  );

  return NextResponse.json({ assetId: asset.id, uploadUrl });
}
