import Link from "next/link";

const STEPS = [
  { name: "upload", desc: "Share file or structured state" },
  { name: "token", desc: "Short scoped pathway token minted" },
  { name: "resolve", desc: "Token resolved with optional selective keys/path" },
  { name: "stream", desc: "Presigned URL or JSON payload slice" },
  { name: "audit", desc: "Agent ID, session, & action logged" },
  { name: "revoke", desc: "Instant revocation for cleanup" },
] as const;

const QUICK_NAV = [
  {
    href: "/docs/quickstart",
    title: "Quickstart",
    desc: "Share state, slice context, or connect MCP tools in 3 lines.",
  },
  {
    href: "/docs/api-reference",
    title: "API Reference",
    desc: "POST /api/upload, POST /api/token, GET /api/resolve/[token], DELETE /api/token/[token].",
  },
  {
    href: "/docs/integrations",
    title: "Integrations & MCP",
    desc: "Claude Desktop, Cursor MCP server, Vercel AI SDK, and LangChain.",
  },
] as const;

export default function DocsHome() {
  return (
    <div className="max-w-3xl">
      {/* Hero */}
      <h1 className="text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
        Secure streaming memory for AI&nbsp;agents.
      </h1>

      <p className="mt-4 text-[#9AA4B2]">
        AgentShare is a developer-first protocol and runtime layer that turns files, working memory,
        and project state into short, scoped, expiring pathway tokens — so one agent&apos;s output
        becomes another agent&apos;s input without bloated context windows or shared filesystems.
      </p>

      {/* Stage Badge */}
      <div className="mt-6 flex items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-[#5EEAD4]/30 bg-[#5EEAD4]/10 px-3 py-1 font-mono text-xs font-medium text-[#5EEAD4]">
          Stage 1 Closed Beta
        </span>
        <span className="text-xs text-[#5C6675]">
          Files + Memory/State + Selective Retrieval + Native MCP Server
        </span>
      </div>

      {/* The primitive */}
      <div className="mt-10">
        <p className="font-mono text-xs uppercase tracking-widest text-[#5C6675]">
          The primitive
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-sm">
          {STEPS.map((step, i) => (
            <span key={step.name} className="flex items-center gap-2">
              <span className="rounded border border-[#2A323C] bg-[#10151B] px-2.5 py-1 text-[#5EEAD4]">
                {step.name}
              </span>
              {i < STEPS.length - 1 && (
                <span className="text-[#5C6675]">→</span>
              )}
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
          {STEPS.map((step) => (
            <p key={step.name} className="text-xs text-[#5C6675]">
              <span className="font-mono text-[#9AA4B2]">{step.name}</span>{" "}
              — {step.desc}
            </p>
          ))}
        </div>
      </div>

      {/* Quick nav */}
      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {QUICK_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-lg border border-[#2A323C] bg-[#10151B] p-5 transition-colors hover:border-[#5EEAD4]/40"
          >
            <h3 className="font-mono text-sm text-[#5EEAD4]">
              {item.title}
              <span className="ml-1 text-[#5C6675] transition-transform group-hover:translate-x-0.5 inline-block">
                →
              </span>
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#9AA4B2]">
              {item.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
