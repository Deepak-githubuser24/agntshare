"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

type QsTab = "python" | "typescript";
type TokenState = "valid" | "expired";
type JsonFilter = "all" | "history" | "scratchpad";

export default function LandingPage() {
  const [qsTab, setQsTab] = useState<QsTab>("python");
  const [tokenState, setTokenState] = useState<TokenState>("valid");
  const [jsonFilter, setJsonFilter] = useState<JsonFilter>("all");
  const [ttl, setTtl] = useState("23:58:41");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TTL countdown
  useEffect(() => {
    let h = 23, m = 58, s = 41;
    const interval = setInterval(() => {
      if (tokenState === "expired") return;
      s--;
      if (s < 0) { s = 59; m--; }
      if (m < 0) { m = 59; h--; }
      if (h < 0) { h = 0; m = 0; s = 0; }
      setTtl(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [tokenState]);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2000);
  }, []);

  const copyQuickstart = useCallback(() => {
    const text = qsTab === "python"
      ? `pip install agentshare\n\nfrom agentshare import client\n\ntoken = client.mint(state=agent_memory, ttl="24h")\nstate = client.resolve("agnt.sr/3r98h3q", keys=["summary"])`
      : `npm install @agentshare/client\n\nimport { client } from "@agentshare/client";\n\nconst token = await client.mint({ state: agentMemory, ttl: "24h" });\nconst state = await client.resolve("agnt.sr/3r98h3q", { keys: ["summary"] });`;
    navigator.clipboard.writeText(text);
    showToast("Code copied to clipboard");
  }, [qsTab, showToast]);

  const copyProtocol = useCallback(() => {
    navigator.clipboard.writeText("agnt.sr/3r98h3q");
    showToast("Protocol ID copied");
  }, [showToast]);

  const jsonNodeClass = (node: string) => {
    if (jsonFilter === "all") return "";
    if (jsonFilter === "history" && node === "history") return "";
    if (jsonFilter === "scratchpad" && node === "scratchpad") return "";
    return "json-dim";
  };

  const isExpired = tokenState === "expired";

  return (
    <main className="min-h-screen bg-[#09090b] text-[#fafafa] overflow-x-hidden">
      {/* Toast */}
      <div className={`toast-container ${toastVisible ? "toast-visible" : ""}`}>
        <div className="toast-pill">
          <span className="w-[18px] h-[18px] rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            {/* @ts-expect-error iconify-icon is a web component */}
            <iconify-icon icon="lucide:check" style={{ fontSize: 12 }} />
          </span>
          {toastMsg}
        </div>
      </div>

      <div className="min-h-screen dot-grid relative flex flex-col items-center">
        {/* Navigation */}
        <nav className="w-full fixed top-0 z-50 px-6 py-4 flex items-center justify-center pointer-events-none">
          <div className="max-w-7xl w-full flex items-center justify-between pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2.5">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold tracking-tighter mono">AGNT.SR</Link>
              <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-zinc-400">
                <Link href="/docs" className="hover:text-white transition-colors">Docs &amp; RFC</Link>
                <Link href="/docs/api-reference" className="hover:text-white transition-colors">API Reference</Link>
                <Link href="/docs/integrations" className="hover:text-white transition-colors">Integrations</Link>
                <a href="https://github.com/Deepak-githubuser24/agntshare" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/Deepak-githubuser24/agntshare" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-[13px] font-medium hover:bg-white/5 transition-colors">
                {/* @ts-expect-error iconify-icon is a web component */}
                <iconify-icon icon="lucide:star" className="text-amber-400" />
                <span>12.4k</span>
              </a>
              <Link href="/login" className="bg-white text-black px-4 py-1.5 rounded-full text-[13px] font-semibold hover:bg-zinc-200 transition-colors">
                Get API Key
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="w-full max-w-7xl px-6 pt-44 pb-32 relative z-10 flex flex-col items-center">
          {/* Hero */}
          <section className="text-center max-w-4xl animate-reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold tracking-widest uppercase mb-6 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              v2.1.0 Protocol Standardized
            </div>
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[0.9] text-white">
              HTTPS for <span className="text-zinc-500">AI Agent State.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Today, agents hand off tasks by stuffing 100k+ tokens of raw memory into prompt windows.
              It&apos;s slow, expensive, and degrades context. Agntshare replaces raw context with a
              cryptographically verified &quot;coat-check ticket.&quot; Pass the token, not the bloat.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="bg-white text-black px-8 py-3.5 rounded-xl font-bold text-[15px] flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                Get API Key (Private Beta)
                {/* @ts-expect-error iconify-icon is a web component */}
                <iconify-icon icon="lucide:arrow-right" className="text-lg" />
              </Link>
              <Link href="/docs" className="border border-white/10 bg-white/5 px-8 py-3.5 rounded-xl font-bold text-[15px] hover:bg-white/10 transition-all">
                Read the Docs
              </Link>
            </div>
          </section>

          {/* Quickstart */}
          <section className="mt-32 w-full max-w-3xl mx-auto relative animate-reveal" style={{ animationDelay: "0.1s" }}>
            <div className="subpixel-border rounded-2xl bg-[#0c0c0e]/80 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-black/50">
              <div className="h-12 border-b border-white/5 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQsTab("python")} className={`qs-tab ${qsTab === "python" ? "active" : ""} px-3 py-1 rounded-md text-[12px] font-semibold mono transition-colors`}>Python</button>
                  <button onClick={() => setQsTab("typescript")} className={`qs-tab ${qsTab === "typescript" ? "active" : ""} px-3 py-1 rounded-md text-[12px] font-semibold mono transition-colors`}>TypeScript</button>
                </div>
                <button onClick={copyQuickstart} className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  Copy
                  {/* @ts-expect-error iconify-icon is a web component */}
                  <iconify-icon icon="lucide:copy" className="text-sm" />
                </button>
              </div>
              <div className="p-6 mono text-[13px] leading-relaxed overflow-x-auto no-scrollbar">
                {qsTab === "python" ? (
                  <div className="space-y-1.5">
                    <div><span className="text-zinc-500">$</span> <span className="text-zinc-200">pip install agentshare</span></div>
                    <div className="pt-3"><span className="text-blue-400">from</span> <span className="text-zinc-200">agentshare</span> <span className="text-blue-400">import</span> <span className="text-zinc-200">client</span></div>
                    <div className="pt-3 text-zinc-500"># Mint a token (Agent A)</div>
                    <div><span className="text-zinc-200">token</span> <span className="text-zinc-500">=</span> <span className="text-zinc-200">client</span>.<span className="text-yellow-300">mint</span>(<span className="text-sky-300">state</span>=<span className="text-zinc-200">agent_memory</span>, <span className="text-sky-300">ttl</span>=<span className="json-string">&quot;24h&quot;</span>)</div>
                    <div className="pt-3 text-zinc-500"># Resolve instantly (Agent B)</div>
                    <div><span className="text-zinc-200">state</span> <span className="text-zinc-500">=</span> <span className="text-zinc-200">client</span>.<span className="text-yellow-300">resolve</span>(<span className="json-string">&quot;agnt.sr/3r98h3q&quot;</span>, <span className="text-sky-300">keys</span>=[<span className="json-string">&quot;summary&quot;</span>])</div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div><span className="text-zinc-500">$</span> <span className="text-zinc-200">npm install @agentshare/client</span></div>
                    <div className="pt-3"><span className="text-blue-400">import</span> <span className="text-zinc-200">{"{ client }"}</span> <span className="text-blue-400">from</span> <span className="json-string">&quot;@agentshare/client&quot;</span>;</div>
                    <div className="pt-3 text-zinc-500">{"// Mint a token (Agent A)"}</div>
                    <div><span className="text-blue-400">const</span> <span className="text-zinc-200">token</span> <span className="text-zinc-500">=</span> <span className="text-zinc-200">await client</span>.<span className="text-yellow-300">mint</span>({"{ "}<span className="text-sky-300">state</span>: agentMemory, <span className="text-sky-300">ttl</span>: <span className="json-string">&quot;24h&quot;</span>{" }"});</div>
                    <div className="pt-3 text-zinc-500">{"// Resolve instantly (Agent B)"}</div>
                    <div><span className="text-blue-400">const</span> <span className="text-zinc-200">state</span> <span className="text-zinc-500">=</span> <span className="text-zinc-200">await client</span>.<span className="text-yellow-300">resolve</span>(<span className="json-string">&quot;agnt.sr/3r98h3q&quot;</span>, {"{ "}<span className="text-sky-300">keys</span>: [<span className="json-string">&quot;summary&quot;</span>]{" }"});</div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Interactive Explorer */}
          <section className="mt-44 w-full relative animate-reveal" style={{ animationDelay: "0.2s" }}>
            {/* Flow Diagram */}
            <div className="mb-10 flex justify-center">
              <div className="mono text-[11px] md:text-[13px] text-zinc-500 flex flex-wrap items-center justify-center gap-2 text-center">
                <span className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-zinc-300">[ 120k Token Context ]</span>
                <span className="text-zinc-600">──(Client Compression)──&gt;</span>
                <span className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-zinc-300">[ agnt.sr/3r98h3q ]</span>
                <span className="text-zinc-600">──(Zero-Trust Transfer)──&gt;</span>
                <span className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-zinc-300">[ Target Agent ]</span>
              </div>
            </div>
            {/* Decorative Glows */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px]" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-zinc-500/10 rounded-full blur-[120px]" />

            <div className="subpixel-border rounded-2xl bg-[#0c0c0e]/80 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-black/50">
              {/* MacOS Top Bar */}
              <div className="h-12 border-b border-white/5 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex-1 flex justify-center px-4">
                  <div className="max-w-md w-full h-7 bg-white/5 rounded-md border border-white/5 flex items-center px-3 gap-2">
                    {/* @ts-expect-error iconify-icon is a web component */}
                    <iconify-icon icon="lucide:lock" className="text-zinc-500 text-xs" />
                    <span className="text-xs mono text-zinc-400">agnt.sr/3r98h3q</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 text-[10px] font-bold mono">
                    <button onClick={() => setTokenState("valid")} className={`token-toggle ${tokenState === "valid" ? "active" : ""} px-2.5 py-1 rounded-full transition-all`}>🟢 Valid Token</button>
                    <button onClick={() => setTokenState("expired")} className={`token-toggle ${tokenState === "expired" ? "active" : ""} px-2.5 py-1 rounded-full transition-all`}>🔴 Expired/Tampered</button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row min-h-[500px]">
                {/* Left Panel: Metadata */}
                <div className="w-full lg:w-80 border-r border-white/5 p-6 flex flex-col gap-6">
                  <div>
                    <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Transfer Stats</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg">
                        <div className="text-[10px] text-zinc-500 mb-1">Simulated Tokens Saved</div>
                        <div className="text-xl font-bold mono">124,842</div>
                      </div>
                      <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg">
                        <div className="text-[10px] text-zinc-500 mb-1">Example Bandwidth Saved</div>
                        <div className="text-xl font-bold mono">4.2MB</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Framework</span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">LangChain</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">TTL Countdown</span>
                      <span className="text-xs font-semibold mono text-zinc-300">{isExpired ? "EXPIRED" : ttl}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Signature</span>
                      <div className="flex items-center gap-1 text-xs text-zinc-300">
                        {isExpired ? (
                          <>
                            {/* @ts-expect-error iconify-icon is a web component */}
                            <iconify-icon icon="lucide:x-circle" className="text-red-500" /> Failed
                          </>
                        ) : (
                          <>
                            {/* @ts-expect-error iconify-icon is a web component */}
                            <iconify-icon icon="lucide:check-circle" className="text-emerald-500" /> Validated
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className={`provenance-badge ${isExpired ? "expired" : ""} flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-bold mono transition-all`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? "bg-red-400" : "bg-emerald-400"}`} />
                      <span>{isExpired ? "Provenance Failed" : "Provenance Verified"}</span>
                    </div>
                    {isExpired && (
                      <div className="mt-2 px-3 py-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-[11px] text-red-400 mono">
                        403 Hash Mismatch Error
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel: JSON View */}
                <div className="flex-1 p-0 flex flex-col">
                  <div className="h-10 border-b border-white/5 bg-white/[0.02] flex items-center px-6">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Pathway Payload Explorer</span>
                      <div className="flex items-center gap-2">
                        {(["all", "history", "scratchpad"] as const).map((f) => (
                          <button key={f} onClick={() => setJsonFilter(f)} className={`filter-chip ${jsonFilter === f ? "active" : ""} px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] text-zinc-400 hover:text-white transition-all`}>
                            {f === "all" ? "?all" : `?keys=${f === "history" ? "conversation_history" : "scratchpad"}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-6 mono text-[13px] leading-relaxed overflow-x-auto no-scrollbar">
                    <div className="space-y-1">
                      <div><span className="text-zinc-500">{"{"}</span></div>
                      <div className={`pl-6 ${jsonNodeClass("all")}`}><span className="json-key">&quot;id&quot;</span>: <span className="json-string">&quot;agnt_3r98h3q&quot;</span>,</div>
                      <div className={`pl-6 ${jsonNodeClass("all")}`}><span className="json-key">&quot;object&quot;</span>: <span className="json-string">&quot;pathway_token&quot;</span>,</div>
                      <div className={`pl-6 ${jsonNodeClass("all")}`}><span className="json-key">&quot;metadata&quot;</span>: <span className="text-zinc-500">{"{"}</span></div>
                      <div className={`pl-12 ${jsonNodeClass("all")}`}><span className="json-key">&quot;source_agent&quot;</span>: <span className="json-string">&quot;ResearchAgent_v4&quot;</span>,</div>
                      <div className={`pl-12 ${jsonNodeClass("history")}`}><span className="json-key">&quot;target_agent&quot;</span>: <span className="json-string">&quot;WritingAgent_v4&quot;</span>,</div>
                      <div className={`pl-12 ${jsonNodeClass("all")}`}><span className="json-key">&quot;compression&quot;</span>: <span className="json-string">&quot;zstd-19&quot;</span></div>
                      <div className={`pl-6 ${jsonNodeClass("all")}`}><span className="text-zinc-500">{"}"}</span>,</div>
                      <div className={`pl-6 ${jsonNodeClass("all")}`}><span className="json-key">&quot;state&quot;</span>: <span className="text-zinc-500">{"{"}</span></div>
                      <div className={`pl-12 ${jsonNodeClass("all")}`}><span className="json-key">&quot;context_hash&quot;</span>: <span className="json-string">&quot;sha256:e3b0c442...&quot;</span></div>
                      <div className={`pl-12 ${jsonNodeClass("all")}`}><span className="text-zinc-500">,</span></div>
                      <div className={`pl-12 ${jsonNodeClass("all")}`}><span className="json-key">&quot;variables&quot;</span>: <span className="text-zinc-500">[</span></div>
                      <div className={`pl-12 ml-6 ${jsonNodeClass("all")}`}><span className="json-string">&quot;user_intent&quot;</span>,</div>
                      <div className={`pl-12 ml-6 ${jsonNodeClass("scratchpad")}`}><span className="json-string">&quot;document_schema&quot;</span>,</div>
                      <div className={`pl-12 ml-6 ${jsonNodeClass("all")}`}><span className="json-string">&quot;auth_scope&quot;</span></div>
                      <div className={`pl-12 ${jsonNodeClass("all")}`}><span className="text-zinc-500">]</span>,</div>
                      <div className={`pl-12 ${jsonNodeClass("all")}`}><span className="json-key">&quot;expires_at&quot;</span>: <span className="json-num">1715632400</span></div>
                      <div className={`pl-6 ${jsonNodeClass("all")}`}><span className="text-zinc-500">{"}"}</span>,</div>
                      <div className={`pl-6 ${jsonNodeClass("all")}`}><span className="json-key">&quot;verified&quot;</span>: <span className="json-bool">{isExpired ? "false" : "true"}</span></div>
                      <div><span className="text-zinc-500">{"}"}</span></div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-zinc-400 mono">
                        {/* @ts-expect-error iconify-icon is a web component */}
                        <iconify-icon icon="lucide:file-json" /> JSON
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-zinc-400 mono">
                        {/* @ts-expect-error iconify-icon is a web component */}
                        <iconify-icon icon="lucide:clock" /> 4ms RTT
                      </div>
                    </div>
                    <button onClick={copyProtocol} className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                      Copy Protocol ID
                      {/* @ts-expect-error iconify-icon is a web component */}
                      <iconify-icon icon="lucide:copy" className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Architecture */}
          <section className="mt-48 w-full animate-reveal" style={{ animationDelay: "0.4s" }}>
            <div className="flex flex-col items-center text-center mb-20">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">The Blind Pipe Architecture.</h2>
              <p className="text-zinc-500 max-w-xl">Privacy-first infrastructure that decouples your agent&apos;s state from the underlying LLM context window.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento 1 */}
              <div className="bento-card rounded-2xl p-8 flex flex-col gap-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/10 transition-colors duration-300">
                  {/* @ts-expect-error iconify-icon is a web component */}
                  <iconify-icon icon="lucide:cpu" className="text-6xl" />
                </div>
                <div className="space-y-4 z-10">
                  <h3 className="text-xl font-bold">Stateless by Design</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Our backend never buffers your payload. The SDK orchestrates secure S3 presigned URLs, meaning the protocol scales infinitely without touching your compute.</p>
                </div>
                <div className="mt-auto glow-code mono text-[10px] text-zinc-400 border border-blue-500/20">
                  $ GET /protocol/presign<br />$ STATUS 200 OK<br />$ PAYLOAD_URL: amzn.s3.direct/...
                </div>
              </div>
              {/* Bento 2 */}
              <div className="bento-card rounded-2xl p-8 flex flex-col gap-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/10 transition-colors duration-300">
                  {/* @ts-expect-error iconify-icon is a web component */}
                  <iconify-icon icon="lucide:shield-check" className="text-6xl" />
                </div>
                <div className="space-y-4 z-10">
                  <h3 className="text-xl font-bold">Zero-Trust Provenance</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Every token is cryptographically signed. Client-side SHA-256 hashing ensures data integrity is mathematically verified before the receiving agent processes the state.</p>
                </div>
                <div className="mt-auto flex flex-col gap-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] mono text-emerald-400">
                    <span>SIGNATURE_VALID</span>
                    {/* @ts-expect-error iconify-icon is a web component */}
                    <iconify-icon icon="lucide:check" />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded bg-white/5 border border-white/10 text-[10px] mono text-zinc-500">
                    <span>HASH: 8f2b...3a1c</span>
                  </div>
                </div>
              </div>
              {/* Bento 3 */}
              <div className="bento-card rounded-2xl p-8 flex flex-col gap-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/10 transition-colors duration-300">
                  {/* @ts-expect-error iconify-icon is a web component */}
                  <iconify-icon icon="lucide:layers" className="text-6xl" />
                </div>
                <div className="space-y-4 z-10">
                  <h3 className="text-xl font-bold">Framework Agnostic</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Whether you&apos;re running local Python scripts, enterprise LangGraph workflows, or autonomous CrewAI fleets, Agntshare works as a standard sidecar.</p>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2">
                  {[
                    { icon: "logos:python", label: "SDK" },
                    { icon: "lucide:box", label: "LangChain", color: "text-blue-400" },
                    { icon: "lucide:users", label: "CrewAI", color: "text-orange-400" },
                    { icon: "lucide:globe", label: "MCP", color: "text-zinc-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded bg-white/5 border border-white/10 text-[11px] font-medium text-zinc-300">
                      {/* @ts-expect-error iconify-icon is a web component */}
                      <iconify-icon icon={item.icon} className={`text-xs ${item.color || ""}`} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Comparison Table */}
          <section className="mt-48 w-full max-w-4xl animate-reveal" style={{ animationDelay: "0.5s" }}>
            <div className="flex flex-col items-center text-center mb-14">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">Engineered for Multi-Agent Systems.</h2>
              <p className="text-zinc-500 max-w-xl">Why teams move off raw storage buckets once agent handoffs get past a prototype.</p>
            </div>
            <div className="subpixel-border rounded-2xl overflow-hidden bg-white/[0.02]">
              <div className="grid grid-cols-3 text-[12px] font-bold uppercase tracking-widest">
                <div className="p-5 text-zinc-600 border-b border-r border-white/5" />
                <div className="p-5 text-zinc-500 border-b border-r border-white/5">DIY S3 Buckets</div>
                <div className="p-5 text-white border-b border-white/5 bg-emerald-500/5">Agntshare Protocol</div>
              </div>
              {[
                ["TTL Enforcement", "Manual", "Native"],
                ["Cross-Framework Parsing", "Build it yourself", "Automatic"],
                ["Provenance Verification", "None", "Cryptographic Signatures"],
              ].map(([feature, diy, agnt], i) => (
                <div key={feature} className="grid grid-cols-3 text-sm">
                  <div className={`p-5 border-r ${i < 2 ? "border-b" : ""} border-white/5 font-semibold text-zinc-300`}>{feature}</div>
                  <div className={`p-5 border-r ${i < 2 ? "border-b" : ""} border-white/5 text-zinc-500`}>{diy}</div>
                  <div className={`p-5 ${i < 2 ? "border-b" : ""} border-white/5 text-zinc-200 flex items-center gap-2`}>
                    {/* @ts-expect-error iconify-icon is a web component */}
                    <iconify-icon icon="lucide:check" className="text-emerald-400" /> {agnt}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Why Now Manifesto */}
          <section className="mt-48 w-full max-w-3xl mx-auto text-center animate-reveal">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-[1.15] mb-6 text-white">
              Multi-agent systems cannot scale on single-agent infrastructure.
            </h2>
            <p className="text-zinc-500 text-lg leading-[1.9]">
              LLMs evolved from single-turn chatbots to multi-agent autonomous swarms. But the transport layer didn&apos;t.
              Passing large contexts between agents today means serializing 100k+ tokens through an HTTP request,
              suffering massive latency, and bleeding compute costs. Agntshare exists to unblock the agentic web.
            </p>
          </section>

          {/* Benchmarks */}
          <section className="mt-48 w-full max-w-5xl animate-reveal">
            <div className="flex flex-col items-center text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold tracking-widest uppercase mb-6 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Benchmarked, not marketed
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">Raw Handoff vs. Agntshare Protocol.</h2>
              <p className="text-zinc-500 max-w-xl">Same payload, same agents, two transport strategies. The delta compounds with every hop.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { label: "Latency / Hop", raw: "12.4s", agnt: "45ms", rawPct: 100, agntPct: 3 },
                { label: "Payload Size", raw: "4.2 MB", agnt: "340 Bytes", rawPct: 100, agntPct: 2 },
                { label: "Compute Cost", raw: "~$0.35", agnt: "$0.00", rawPct: 100, agntPct: 0, note: "Client-side, edge routed." },
              ].map((b) => (
                <div key={b.label} className="bento-card rounded-2xl p-7">
                  <div className="mono text-[11px] uppercase tracking-widest text-zinc-500 mb-6">{b.label}</div>
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-zinc-500">Raw Context Handoff</span>
                      <span className="mono text-sm font-bold text-red-400">{b.raw}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-red-500/70" style={{ width: `${b.rawPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-zinc-300">Agntshare Protocol</span>
                      <span className="mono text-sm font-bold text-emerald-400">{b.agnt}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${b.agntPct}%` }} />
                    </div>
                  </div>
                  {b.note && <div className="mt-4 text-[11px] text-zinc-600">{b.note}</div>}
                </div>
              ))}
            </div>
          </section>

          {/* Ecosystem Marquee */}
          <section className="mt-48 w-full animate-reveal">
            <div className="flex flex-col items-center text-center mb-14 px-6">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">The Universal Translator for Agentic State.</h2>
              <p className="text-zinc-500 max-w-xl">Tokens resolve identically regardless of the originating stack.</p>
            </div>
            <div className="marquee-mask relative w-full overflow-hidden">
              <div className="marquee-track flex items-center gap-16 w-max">
                {[0, 1].map((set) => (
                  <div key={set} className="flex items-center gap-16 shrink-0" aria-hidden={set === 1 ? true : undefined}>
                    {[
                      { icon: "simple-icons:langchain", name: "LangChain" },
                      { icon: "lucide:users", name: "CrewAI" },
                      { icon: "lucide:git-branch", name: "AutoGen" },
                      { icon: "lucide:layers", name: "LlamaIndex" },
                      { icon: "lucide:plug-2", name: "Model Context Protocol" },
                      { icon: "simple-icons:python", name: "Python" },
                      { icon: "simple-icons:typescript", name: "TypeScript" },
                      { icon: "simple-icons:go", name: "Go" },
                    ].map((item) => (
                      <div key={`${set}-${item.name}`} className="logo-chip flex items-center gap-2.5">
                        {/* @ts-expect-error iconify-icon is a web component */}
                        <iconify-icon icon={item.icon} className="text-2xl" />
                        <span className="mono text-sm font-medium">{item.name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Social Proof */}
          <section className="mt-48 w-full flex flex-col items-center text-center gap-6 animate-reveal">
            <p className="text-zinc-400 text-lg tracking-wide">
              Join <span className="text-white font-semibold">400+</span> teams building the agentic web.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="bg-white text-black px-8 py-3.5 rounded-xl font-bold text-[15px] flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                Get API Key (Private Beta)
                {/* @ts-expect-error iconify-icon is a web component */}
                <iconify-icon icon="lucide:arrow-right" className="text-lg" />
              </Link>
              <Link href="/docs" className="border border-white/10 bg-white/5 px-8 py-3.5 rounded-xl font-bold text-[15px] hover:bg-white/10 transition-all">
                Read the Docs
              </Link>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-48 w-full border-t border-white/5 pt-12 pb-12 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold tracking-tighter mono text-white text-sm">AGNT.SR</span>
              <span>© 2026 Agntshare Protocol Standards</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://github.com/Deepak-githubuser24/agntshare" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://pypi.org/project/agntshare/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">PyPI</a>
              <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
              <span className="hover:text-white transition-colors cursor-default">MIT License</span>
            </div>
          </footer>

          {/* Legal Disclosure */}
          <footer className="w-full border-t border-white/5 py-8 text-center text-sm text-zinc-600">
            <div className="mx-auto max-w-4xl px-4">
              <p>AgentShare is currently in closed beta. We collect your email for login and store uploaded files securely in your configured object storage. Tokens and files are retained according to your configured expiration.</p>
              <p className="mt-2">A full Terms of Service and Privacy Policy will be published prior to public launch.</p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
