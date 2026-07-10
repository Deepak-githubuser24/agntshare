function CodeBlock({
  children,
  lang,
}: {
  children: string;
  lang?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#2A323C] bg-[#10151B]">
      {lang && (
        <div className="border-b border-[#2A323C] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-[#5C6675]">
          {lang}
        </div>
      )}
      <pre className="p-4 font-mono text-sm leading-relaxed text-[#9AA4B2]">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Issue({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#2A323C] bg-[#10151B] p-6">
      <h2 className="font-mono text-sm text-[#5EEAD4]">{title}</h2>
      <div className="mt-4 space-y-4 text-sm text-[#9AA4B2]">{children}</div>
    </section>
  );
}

export default function TroubleshootingPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">
          Troubleshooting
        </h1>
        <p className="mt-3 text-[#9AA4B2]">
          Common issues and how to fix them.
        </p>
      </div>

      {/* Postgres */}
      <Issue title="Local Postgres connection refused">
        <p>
          If you see{" "}
          <code className="text-[#EDEAE3]">
            ECONNREFUSED 127.0.0.1:5432
          </code>{" "}
          when running locally, check that your Postgres container is running
          and the connection string matches your{" "}
          <code className="text-[#EDEAE3]">.env.local</code>.
        </p>
        <CodeBlock lang="shell">{`# Start the database
docker compose up -d postgres

# Verify it's running
docker compose ps

# Check your .env.local has the correct DATABASE_URL
# DATABASE_URL=postgresql://user:password@localhost:5432/agentshare`}</CodeBlock>
        <p>
          If you&apos;re on macOS and Postgres was installed via Homebrew, the
          socket path may conflict with Docker. Use{" "}
          <code className="text-[#EDEAE3]">127.0.0.1</code> explicitly instead
          of <code className="text-[#EDEAE3]">localhost</code>.
        </p>
      </Issue>

      {/* MinIO */}
      <Issue title="MinIO bucket not found or access denied">
        <p>
          The upload endpoint returns a presigned URL pointing at your MinIO
          (or S3) bucket. If you get a{" "}
          <code className="text-[#EDEAE3]">NoSuchBucket</code> or{" "}
          <code className="text-[#EDEAE3]">AccessDenied</code> error:
        </p>
        <CodeBlock lang="shell">{`# 1. Ensure MinIO is running
docker compose up -d minio

# 2. Create the bucket if it doesn't exist
# Using the MinIO client (mc):
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/agentshare

# 3. Verify your .env.local
# S3_ENDPOINT=http://localhost:9000
# S3_BUCKET=agentshare
# S3_ACCESS_KEY=minioadmin
# S3_SECRET_KEY=minioadmin
# S3_REGION=us-east-1`}</CodeBlock>
        <p>
          If you&apos;re using AWS S3 instead of MinIO, ensure the IAM
          role/user has <code className="text-[#EDEAE3]">s3:PutObject</code>{" "}
          and <code className="text-[#EDEAE3]">s3:GetObject</code> permissions
          on the target bucket.
        </p>
      </Issue>

      {/* Auth.js */}
      <Issue title="Auth.js session issues">
        <p>
          If the dashboard shows you as unauthenticated or sessions expire
          immediately:
        </p>
        <CodeBlock lang="shell">{`# 1. Ensure AUTH_SECRET is set (generate one if missing)
npx auth secret

# 2. Required .env.local values
# AUTH_SECRET=your-generated-secret
# AUTH_URL=http://localhost:3000

# 3. If using a database adapter, run migrations
npx prisma migrate dev`}</CodeBlock>
        <p>
          Common causes: missing{" "}
          <code className="text-[#EDEAE3]">AUTH_SECRET</code>, mismatched{" "}
          <code className="text-[#EDEAE3]">AUTH_URL</code> (must match the
          actual URL you&apos;re accessing), or cookie domain issues behind a
          reverse proxy.
        </p>
      </Issue>

      {/* CORS */}
      <Issue title="CORS errors with presigned URLs">
        <p>
          When uploading from a browser, you may see CORS errors on the{" "}
          <code className="text-[#EDEAE3]">PUT</code> to the presigned URL.
          This is a storage-level CORS issue, not an AgentShare issue.
        </p>
        <CodeBlock lang="shell">{`# For MinIO, set CORS via mc:
mc admin config set local api cors_allow_origin="http://localhost:3000"
mc admin service restart local

# For AWS S3, add a CORS configuration to the bucket:
# {
#   "CORSRules": [{
#     "AllowedOrigins": ["http://localhost:3000"],
#     "AllowedMethods": ["PUT", "GET"],
#     "AllowedHeaders": ["*"],
#     "MaxAgeSeconds": 3600
#   }]
# }`}</CodeBlock>
        <p>
          In production, replace{" "}
          <code className="text-[#EDEAE3]">http://localhost:3000</code> with
          your actual domain. Never use{" "}
          <code className="text-[#EDEAE3]">*</code> for origins in production.
        </p>
      </Issue>
    </div>
  );
}
