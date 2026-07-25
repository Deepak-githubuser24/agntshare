import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), ".data", "storage");

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function getFilePath(key: string): string {
  ensureStorageDir();
  // Safe sanitized filename for local storage
  const safeName = key.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(STORAGE_DIR, safeName);
}

// PUT /api/dev-storage?key=...
export async function PUT(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "missing_key" }, { status: 400 });
  }

  const arrayBuffer = await req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filePath = getFilePath(key);
  
  fs.writeFileSync(filePath, buffer);
  return new NextResponse(null, { status: 200 });
}

// GET /api/dev-storage?key=...
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "missing_key" }, { status: 400 });
  }

  const filePath = getFilePath(key);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });
}
