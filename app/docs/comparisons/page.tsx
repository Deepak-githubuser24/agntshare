function ComparisonTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#2A323C]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#2A323C] bg-[#10151B]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 font-mono text-xs uppercase tracking-widest text-[#5C6675]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[#2A323C] last:border-0"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 ${
                    j === 0
                      ? "font-mono text-[#EDEAE3]"
                      : "text-[#9AA4B2]"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ComparisonsPage() {
  return (
    <div className="max-w-3xl space-y-14">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Comparisons</h1>
        <p className="mt-3 text-[#9AA4B2]">
          Where AgentShare sits relative to existing approaches.
        </p>
      </div>

      {/* vs S3 Presigned URLs */}
      <section>
        <h2 className="text-xl font-medium tracking-tight">
          AgentShare vs S3 Presigned URLs
        </h2>
        <p className="mt-3 text-sm text-[#9AA4B2]">
          S3 presigned URLs were designed for human-facing download links, not
          agent-to-agent data handoffs. AgentShare wraps the same storage
          primitive with scoped tokens, audit logging, and a resolution layer
          that agents understand.
        </p>
        <div className="mt-6">
          <ComparisonTable
            headers={["", "AgentShare", "S3 Presigned URL"]}
            rows={[
              [
                "Token length",
                "~8 chars (agnt.sr/x97b)",
                "~600+ chars (full query string)",
              ],
              [
                "Auditability",
                "Every resolve logged with agent ID, IP, timestamp",
                "No built-in logging (requires CloudTrail setup)",
              ],
              [
                "Scope",
                "Read / write / stream, per-token",
                "Single operation baked into URL signature",
              ],
              [
                "Expiry",
                "Configurable TTL, default 24h, server-revocable",
                "Baked into signature, max 7 days, not revocable",
              ],
              [
                "Agent-friendliness",
                "Short token fits in tool call output",
                "URL too long for most tool schemas",
              ],
            ]}
          />
        </div>
      </section>

      {/* vs Prompt Context */}
      <section>
        <h2 className="text-xl font-medium tracking-tight">
          AgentShare vs Prompt Context
        </h2>
        <p className="mt-3 text-sm text-[#9AA4B2]">
          The alternative to sharing files is stuffing everything into the
          prompt. This works until it doesn&apos;t — and it stops working fast.
        </p>
        <div className="mt-6">
          <ComparisonTable
            headers={["", "AgentShare", "Prompt Context"]}
            rows={[
              [
                "Latency",
                "Resolve + stream: ~50ms P99",
                "Scales linearly with token count",
              ],
              [
                "Cost per request",
                "Storage only (no LLM token cost)",
                "$0.01–$0.06 per 1K tokens (input pricing)",
              ],
              [
                "Max payload",
                "5 GB per asset",
                "128K–200K tokens (~300KB text)",
              ],
              [
                "Auditability",
                "Full access log per token",
                "None — data is inlined and ephemeral",
              ],
              [
                "Binary support",
                "Any MIME type",
                "Text only (base64 for images inflates cost)",
              ],
            ]}
          />
        </div>
      </section>
    </div>
  );
}
