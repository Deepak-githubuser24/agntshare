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

function Field({
  name,
  type,
  desc,
  required,
}: {
  name: string;
  type: string;
  desc: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#2A323C] py-3 last:border-0">
      <code className="shrink-0 font-mono text-sm text-[#EDEAE3]">{name}</code>
      <span className="shrink-0 rounded bg-[#2A323C] px-1.5 py-0.5 font-mono text-[10px] text-[#9AA4B2]">
        {type}
      </span>
      {required && (
        <span className="shrink-0 font-mono text-[10px] text-[#5EEAD4]">
          required
        </span>
      )}
      <span className="text-sm text-[#5C6675]">{desc}</span>
    </div>
  );
}

function Endpoint({
  method,
  path,
  children,
}: {
  method: string;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#2A323C] bg-[#10151B] p-6">
      <div className="flex items-center gap-3">
        <span className="rounded bg-[#5EEAD4]/10 px-2 py-1 font-mono text-xs font-medium text-[#5EEAD4]">
          {method}
        </span>
        <code className="font-mono text-sm text-[#EDEAE3]">{path}</code>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function ApiReferencePage() {
  return (
    <div className="max-w-3xl space-y-12">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">API Reference</h1>
        <p className="mt-3 text-[#9AA4B2]">
          Three endpoints. That&apos;s the whole API.
        </p>
      </div>

      {/* POST /api/upload */}
      <Endpoint method="POST" path="/api/upload">
        <p className="text-sm text-[#9AA4B2]">
          Returns a presigned upload URL and an asset ID. Upload the file
          directly to the returned URL with a <code className="text-[#EDEAE3]">PUT</code> request.
        </p>

        <div className="mt-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
            Request body
          </p>
          <div className="rounded border border-[#2A323C] bg-[#0B0F13] px-4">
            <Field name="filename" type="string" desc="Name of the file." required />
            <Field name="contentType" type="string" desc="MIME type." required />
            <Field name="sizeBytes" type="number" desc="File size in bytes." required />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
            Response
          </p>
          <div className="rounded border border-[#2A323C] bg-[#0B0F13] px-4">
            <Field name="uploadUrl" type="string" desc="Presigned PUT URL (expires in 15 min)." />
            <Field name="assetId" type="string" desc="Unique identifier for the asset." />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
            cURL
          </p>
          <CodeBlock lang="shell">{`curl -X POST https://your-host/api/upload \\
  -H "Authorization: Bearer $AGENTSHARE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "filename": "context.json",
    "contentType": "application/json",
    "sizeBytes": 4096
  }'`}</CodeBlock>
        </div>
      </Endpoint>

      {/* POST /api/token */}
      <Endpoint method="POST" path="/api/token">
        <p className="text-sm text-[#9AA4B2]">
          Mints a short, scoped, expiring share token for an uploaded asset.
        </p>

        <div className="mt-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
            Request body
          </p>
          <div className="rounded border border-[#2A323C] bg-[#0B0F13] px-4">
            <Field name="assetId" type="string" desc="The asset ID from the upload step." required />
            <Field name="expiresIn" type="number" desc="TTL in seconds. Default: 86400 (24h)." />
            <Field name="scope" type="string" desc="Permission scope. Default: 'read'." />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
            Response
          </p>
          <div className="rounded border border-[#2A323C] bg-[#0B0F13] px-4">
            <Field name="token" type="string" desc="Short share token." />
            <Field name="shareUrl" type="string" desc="Full share URL (e.g. https://agnt.sr/x97b)." />
            <Field name="expiresAt" type="string" desc="ISO 8601 expiry timestamp." />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
            cURL
          </p>
          <CodeBlock lang="shell">{`curl -X POST https://your-host/api/token \\
  -H "Authorization: Bearer $AGENTSHARE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "assetId": "ast_7g2k...",
    "expiresIn": 3600,
    "scope": "read"
  }'`}</CodeBlock>
        </div>
      </Endpoint>

      {/* GET /api/resolve/[token] */}
      <Endpoint method="GET" path="/api/resolve/[token]">
        <p className="text-sm text-[#9AA4B2]">
          Resolves a share token and streams the underlying asset. Supports
          byte-range requests via the standard{" "}
          <code className="text-[#EDEAE3]">Range</code> header.
        </p>

        <div className="mt-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
            Response
          </p>
          <div className="rounded border border-[#2A323C] bg-[#0B0F13] px-4">
            <Field name="body" type="ReadableStream" desc="The file contents, streamed." />
            <Field name="Content-Type" type="header" desc="Original MIME type of the uploaded file." />
            <Field name="Content-Length" type="header" desc="File size in bytes." />
            <Field name="X-AgentShare-Asset" type="header" desc="The asset ID." />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
            cURL
          </p>
          <CodeBlock lang="shell">{`curl https://your-host/api/resolve/x97b \\
  -H "Range: bytes=0-1023"`}</CodeBlock>
        </div>
      </Endpoint>
    </div>
  );
}
