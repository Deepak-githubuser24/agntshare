import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Smart detection: Use real S3 only if explicit non-default credentials and endpoint are provided.
// Otherwise, fall back to zero-dependency built-in /api/dev-storage route for local development.
const hasCustomS3 = Boolean(
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_ACCESS_KEY_ID !== "minioadmin" &&
  process.env.S3_ENDPOINT &&
  !process.env.S3_ENDPOINT.includes("localhost:9000") &&
  !process.env.S3_ENDPOINT.includes("127.0.0.1:9000")
);

const accessKeyId = process.env.S3_ACCESS_KEY_ID || "minioadmin";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "minioadmin";
const endpoint = process.env.S3_ENDPOINT || "http://127.0.0.1:9000";
const region = process.env.S3_REGION || "us-east-1";
const BUCKET = process.env.S3_BUCKET || "agentshare-assets";

export const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "").replace("localhost", "127.0.0.1");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  return "http://127.0.0.1:3000";
}

export async function getUploadUrl(key: string, contentType: string) {
  // If real S3 credentials are not configured, use built-in dev storage route
  if (!hasCustomS3) {
    const appUrl = getAppUrl();
    return `${appUrl}/api/dev-storage?key=${encodeURIComponent(key)}`;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });
    return await getSignedUrl(s3, command, { expiresIn: 300 });
  } catch (err: unknown) {
    const errorObj = err as { message?: string };
    throw new Error(`S3 Presigner Error: ${errorObj?.message || String(err)}`);
  }
}

export async function getDownloadUrl(key: string, expiresInSeconds = 300) {
  // If real S3 credentials are not configured, use built-in dev storage route
  if (!hasCustomS3) {
    const appUrl = getAppUrl();
    return `${appUrl}/api/dev-storage?key=${encodeURIComponent(key)}`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  } catch (err: unknown) {
    const errorObj = err as { message?: string };
    throw new Error(`S3 Presigner Error: ${errorObj?.message || String(err)}`);
  }
}
