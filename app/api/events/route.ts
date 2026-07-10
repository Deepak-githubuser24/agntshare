import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, properties } = body;

    if (!event || typeof event !== "string") {
      return NextResponse.json({ error: "missing_event" }, { status: 400 });
    }

    // Store in audit_logs table for unified observability
    await query(
      `INSERT INTO audit_logs (event_type, metadata)
       VALUES ($1, $2)`,
      [event, JSON.stringify(properties || {})]
    );

    return NextResponse.json({ ok: true });
  } catch {
    // Never fail on analytics — silently accept
    return NextResponse.json({ ok: true });
  }
}
