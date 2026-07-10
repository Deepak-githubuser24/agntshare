import { S3Client, CreateBucketCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT || "http://127.0.0.1:9000",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
  },
});

async function main() {
  const bucket = process.env.S3_BUCKET || "agentshare";
  try {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`Bucket '${bucket}' created successfully.`);
  } catch (err: any) {
    if (err.name === "BucketAlreadyExists" || err.name === "BucketAlreadyOwnedByYou") {
      console.log(`Bucket '${bucket}' already exists.`);
    } else {
      console.error("Failed to create bucket:", err);
      process.exit(1);
    }
  }
}
main();
