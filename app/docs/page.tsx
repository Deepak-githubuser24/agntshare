import Link from "next/link";

const STEPS = [
  { name: "upload", desc: "Agent sends a file" },
  { name: "token", desc: "Short scoped URL minted" },
  { name: "resolve", desc: "Token mapped to asset" },
  { name: "stream", desc: "Byte-range streaming" },
  { name: "audit", desc: "Every access logged" },
  { name: "share", desc: "Pass the token forward" },
] as const;

const QUICK_NAV = [
  {
    href: "/docs/quickstart",
    title: "Quickstart",
    desc: "Upload a file and mint a share token in under 10 lines.",
  },
  {
    href: "/docs/api-reference",
    title: "API Reference",
    desc: "POST /api/upload, POST /api/token, GET /api/resolve/[token].",
  },
  {
    href: "/docs/integrations",
    title: "Integrations",
    desc: "Vercel AI SDK and LangChain drop-in tools.",
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
        AgentShare is infrastructure that turns any file into a short, scoped,
        expiring token — so one agent&apos;s output becomes another
        agent&apos;s input, without a shared filesystem or bloated prompts.
      </p>

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
