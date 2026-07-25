import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accessKeyId = process.env.S3_ACCESS_KEY_ID || "minioadmin";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "minioadmin";
const endpoint = process.env.S3_ENDPOINT || "http://127.0.0.1:9000";
const region = process.env.S3_REGION || "us-east-1";
const BUCKET = process.env.S3_BUCKET || "agentshare-assets";

export const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: true, // Needed for MinIO/local storage
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function getUploadUrl(key: string, contentType: string) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });
    // 5 minute window to complete the upload
    return await getSignedUrl(s3, command, { expiresIn: 300 });
  } catch (err: any) {
    throw new Error(`S3 Presigner Error: ${err?.message || err}`);
  }
}

export async function getDownloadUrl(key: string, expiresInSeconds = 300) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  } catch (err: any) {
    throw new Error(`S3 Presigner Error: ${err?.message || err}`);
  }
}
