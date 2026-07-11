import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateApiKey, storeApiKey } from "@/lib/auth/api-keys";

/**
 * POST /api/keys — Generate a new API key for the authenticated user.
 * Returns the raw key exactly once. The server stores only the hash.
 */
export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { rawKey, keyHash } = generateApiKey();
  const keyId = await storeApiKey(userId, keyHash);

  return NextResponse.json({
    id: keyId,
    key: rawKey, // Shown exactly once — never stored in plaintext
    message: "Save this key now. It will not be shown again.",
  });
}
