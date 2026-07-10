// Design notes:
// Palette: ink (#0B0F13) bg, bone (#EDEAE3) text, signal (#5EEAD4) accent for tokens/links,
// wire (#2A323C) for hairlines. Display face: a monospace (JetBrains Mono / Geist Mono) used
// large, because the product's whole unit of value IS a short token string — the type itself
// is the signature element. Body face: a plain grotesk (Inter/Geist Sans).
// Signature element: the hero renders an actual pathway — file -> token -> resolve — as a
// live-looking terminal strip, not a generic icon row.

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0B0F13] text-[#EDEAE3]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-mono text-sm tracking-tight text-[#EDEAE3]">
          agentshare
        </span>
        <nav className="flex items-center gap-6 text-sm text-[#9AA4B2]">
          <Link href="/docs" className="hover:text-[#EDEAE3]">
            Docs
          </Link>
          <Link href="/docs/quickstart" className="hover:text-[#EDEAE3]">
            Quickstart
          </Link>
          <Link href="/docs/api-reference" className="hover:text-[#EDEAE3]">
            API
          </Link>
          <a
            href="https://github.com/agentshare/agentshare"
            className="hover:text-[#EDEAE3]"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16">
        <h1 className="max-w-3xl text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
          Secure streaming memory
          <br />
          for AI agents.
        </h1>
        <p className="mt-5 max-w-xl text-[#9AA4B2]">
          Upload an asset, mint a scoped token, and pass it to any LLM —
          without blowing up your context window or sharing raw credentials.
        </p>

        {/* Signature element: a live-looking pathway strip */}
        <div className="mt-10 max-w-xl rounded-lg border border-[#2A323C] bg-[#10151B] font-mono text-sm">
          <div className="flex items-center gap-2 border-b border-[#2A323C] px-4 py-3 text-[#5C6675]">
            <span className="h-2 w-2 rounded-full bg-[#5EEAD4]" />
            pathway
          </div>
          <div className="space-y-2 px-4 py-4 text-[#9AA4B2]">
            <p>
              <span className="text-[#5C6675]">$</span> upload ./run-42/output.json
            </p>
            <p className="text-[#5EEAD4]">→ agnt.sr/x97b (expires in 24h, read-only)</p>
            <p>
              <span className="text-[#5C6675]">$</span> resolve agnt.sr/x97b --stream
            </p>
            <p className="text-[#EDEAE3]">→ streaming 4.2MB… done</p>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/docs/quickstart"
            className="rounded-md bg-[#5EEAD4] px-5 py-2.5 text-sm font-medium text-[#0B0F13] hover:opacity-90"
          >
            Get started →
          </Link>
          <Link href="/docs" className="text-sm text-[#9AA4B2] hover:text-[#EDEAE3]">
            Read the docs
          </Link>
        </div>
      </section>

      {/* Packages */}
      <section className="border-t border-[#2A323C] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-widest text-[#5C6675]">
            Packages
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                name: "@agentshare/sdk",
                lang: "TypeScript",
                install: "npm i @agentshare/sdk",
                desc: "Core SDK. Upload, mint, resolve.",
              },
              {
                name: "@agentshare/vercel-ai",
                lang: "TypeScript",
                install: "npm i @agentshare/vercel-ai",
                desc: "Drop-in Vercel AI SDK tool.",
              },
              {
                name: "agentshare-langchain",
                lang: "Python",
                install: "pip install agentshare-langchain",
                desc: "LangChain BaseTool integration.",
              },
            ].map((pkg) => (
              <div
                key={pkg.name}
                className="rounded-lg border border-[#2A323C] bg-[#10151B] px-5 py-5"
              >
                <p className="font-mono text-sm text-[#5EEAD4]">{pkg.name}</p>
                <p className="mt-1 text-xs text-[#5C6675]">{pkg.lang}</p>
                <p className="mt-3 text-sm text-[#9AA4B2]">{pkg.desc}</p>
                <div className="mt-4 rounded border border-[#2A323C] bg-[#0B0F13] px-3 py-2 font-mono text-xs text-[#9AA4B2]">
                  {pkg.install}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-[#2A323C] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-widest text-[#5C6675]">
            The pathway
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "Upload",
                copy: "An agent uploads a file, log, or memory snapshot. It's stored and checksummed.",
              },
              {
                step: "Token",
                copy: "A short, scoped, expiring token is minted — no shared credentials required.",
              },
              {
                step: "Resolve",
                copy: "Another agent (or human) resolves the token and streams the asset, byte-range and all.",
              },
            ].map((item) => (
              <div key={item.step}>
                <h3 className="font-mono text-sm text-[#5EEAD4]">{item.step}</h3>
                <p className="mt-2 text-sm text-[#9AA4B2]">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-[#2A323C] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-widest text-[#5C6675]">
            Why not just paste it into the prompt?
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#2A323C] text-[#5C6675]">
                  <th className="py-3 pr-6 font-medium"></th>
                  <th className="py-3 pr-6 font-medium">Raw Context</th>
                  <th className="py-3 font-medium text-[#5EEAD4]">AgentShare</th>
                </tr>
              </thead>
              <tbody className="text-[#9AA4B2]">
                {[
                  ["2MB JSON cost", "$1.20/request", "$0.001"],
                  ["Latency", "~15 seconds", "~200ms"],
                  ["Max payload", "~128K tokens", "500MB"],
                  ["Audit trail", "None", "Every access logged"],
                  ["Cross-session", "Dies with chat", "Persistent + expirable"],
                ].map(([label, raw, as]) => (
                  <tr key={label} className="border-b border-[#2A323C]/50">
                    <td className="py-3 pr-6 text-[#EDEAE3]">{label}</td>
                    <td className="py-3 pr-6">{raw}</td>
                    <td className="py-3 text-[#5EEAD4]">{as}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#2A323C] px-6 py-8 text-xs text-[#5C6675]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span>agentshare — 2026</span>
          <div className="flex gap-6">
            <Link href="/docs" className="hover:text-[#EDEAE3]">Docs</Link>
            <a href="https://github.com/agentshare/agentshare" className="hover:text-[#EDEAE3]" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
