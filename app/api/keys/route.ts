import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateApiKey, storeApiKey } from "@/lib/auth/api-keys";

/**
 * POST /api/keys — Generate a new API key for the authenticated user.
 * Returns the raw key exactly once. The server stores only the hash.
 */
export async function POST() {
  try {
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
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    const isDbError = errorObj?.code === 'ECONNREFUSED' || errorObj?.message?.includes('connect ECONNREFUSED');
    if (isDbError) {
      return NextResponse.json(
        { error: "database_unavailable", message: "Failed to connect to PostgreSQL database on port 5432. Please ensure PostgreSQL is running." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "internal_server_error", message: errorObj?.message ?? "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
