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
      ? `import agntshare\n\ntoken = agntshare.mint(state=agent_memory, ttl="24h")\nstate = agntshare.resolve("agnt.sr/x97b", keys=["summary"])`
      : `import agntshare from "agntshare";\n\nconst token = await agntshare.mint({ state: agentMemory, ttl: "24h" });\nconst state = await agntshare.resolve("agnt.sr/x97b", { keys: ["summary"] });`;
    navigator.clipboard.writeText(text);
    showToast("Code copied to clipboard");
  }, [qsTab, showToast]);

  const copyProtocol = useCallback(() => {
    navigator.clipboard.writeText("agnt.sr/x97b");
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
            <p className="text-lg md:text-2xl text-zinc-300 font-medium mb-10 leading-relaxed max-w-3xl mx-auto">
              Pass a cryptographically secure 28-byte token between agents instead of stuffing 50MB raw JSON payloads into prompt windows.
            </p>

            {/* Highly Styled 3-Line Quickstart Box */}
            <div className="w-full max-w-3xl mx-auto mb-10">
              <div className="subpixel-border rounded-2xl bg-[#0c0c0e]/90 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10 text-left">
                <div className="h-11 border-b border-white/10 bg-white/[0.02] flex items-center px-4 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setQsTab("python")} className={`qs-tab ${qsTab === "python" ? "active bg-white/10 text-white font-bold" : "text-zinc-500 hover:text-zinc-300"} px-3 py-1 rounded-md text-[12px] font-semibold mono transition-all`}>Python</button>
                    <button onClick={() => setQsTab("typescript")} className={`qs-tab ${qsTab === "typescript" ? "active bg-white/10 text-white font-bold" : "text-zinc-500 hover:text-zinc-300"} px-3 py-1 rounded-md text-[12px] font-semibold mono transition-all`}>TypeScript</button>
                  </div>
                  <button onClick={copyQuickstart} className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                    Copy
                    {/* @ts-expect-error iconify-icon is a web component */}
                    <iconify-icon icon="lucide:copy" className="text-xs" />
                  </button>
                </div>
                <div className="p-6 mono text-[13px] sm:text-[14px] leading-relaxed overflow-x-auto no-scrollbar bg-[#0c0c0e]">
                  {qsTab === "python" ? (
                    <div className="space-y-2 text-zinc-200">
                      <div><span className="text-blue-400">import</span> <span className="text-zinc-100">agntshare</span></div>
                      <div className="pt-2"><span className="text-zinc-100">token</span> <span className="text-zinc-500">=</span> <span className="text-zinc-100">agntshare</span>.<span className="text-yellow-300 font-semibold">mint</span>(<span className="text-sky-300">state</span>=<span className="text-zinc-200">agent_memory</span>, <span className="text-sky-300">ttl</span>=<span className="json-string">&quot;24h&quot;</span>)</div>
                      <div><span className="text-zinc-100">state</span> <span className="text-zinc-500">=</span> <span className="text-zinc-100">agntshare</span>.<span className="text-yellow-300 font-semibold">resolve</span>(<span className="json-string">&quot;agnt.sr/x97b&quot;</span>, <span className="text-sky-300">keys</span>=[<span className="json-string">&quot;summary&quot;</span>])</div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-zinc-200">
                      <div><span className="text-blue-400">import</span> <span className="text-zinc-100">agntshare</span> <span className="text-blue-400">from</span> <span className="json-string">&quot;agntshare&quot;</span>;</div>
                      <div className="pt-2"><span className="text-blue-400">const</span> <span className="text-zinc-100">token</span> <span className="text-zinc-500">=</span> <span className="text-zinc-100">await agntshare</span>.<span className="text-yellow-300 font-semibold">mint</span>({"{ "}<span className="text-sky-300">state</span>: agentMemory, <span className="text-sky-300">ttl</span>: <span className="json-string">&quot;24h&quot;</span>{" }"});</div>
                      <div><span className="text-blue-400">const</span> <span className="text-zinc-100">state</span> <span className="text-zinc-500">=</span> <span className="text-zinc-100">await agntshare</span>.<span className="text-yellow-300 font-semibold">resolve</span>(<span className="json-string">&quot;agnt.sr/x97b&quot;</span>, {"{ "}<span className="text-sky-300">keys</span>: [<span className="json-string">&quot;summary&quot;</span>]{" }"});</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="bg-white text-black px-8 py-3.5 rounded-xl font-bold text-[15px] flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-white/10">
                Get API Key (Private Beta)
                {/* @ts-expect-error iconify-icon is a web component */}
                <iconify-icon icon="lucide:arrow-right" className="text-lg" />
              </Link>
              <Link href="/docs" className="border border-white/10 bg-white/5 px-8 py-3.5 rounded-xl font-bold text-[15px] hover:bg-white/10 transition-all">
                Read the Docs
              </Link>
            </div>
          </section>

          {/* Interactive Explorer & Visual Flow Schematic */}
          <section className="mt-36 w-full relative animate-reveal" style={{ animationDelay: "0.2s" }}>
            {/* Visual Flow Diagram: Sleek Engineering Schematic */}
            <div className="mb-12 w-full max-w-5xl mx-auto">
              <div className="subpixel-border rounded-xl bg-black/60 border border-white/10 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] mono font-bold text-zinc-400 uppercase tracking-widest mb-8 pb-4 border-b border-white/5 gap-2">
                  <span className="flex items-center gap-2 text-white">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    Protocol Transport Architecture
                  </span>
                  <span className="text-zinc-500">LATENCY: 4MS • OVERHEAD: 28 BYTES</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center justify-center text-center mono">
                  {/* Step 1: Upload */}
                  <div className="md:col-span-1 p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col items-center gap-2.5 hover:bg-white/[0.04] transition-all">
                    {/* @ts-expect-error iconify-icon is a web component */}
                    <iconify-icon icon="lucide:upload-cloud" className="text-2xl text-zinc-300" />
                    <span className="text-[13px] font-bold text-zinc-200">Upload</span>
                    <span className="text-[10px] text-zinc-500">S3 Presigned URL</span>
                  </div>

                  {/* Arrow 1 */}
                  <div className="hidden md:flex flex-col items-center justify-center text-zinc-600">
                    <span className="text-[10px] uppercase text-zinc-500 font-semibold mb-1 tracking-wider">SHA-256</span>
                    <span className="text-emerald-400 font-mono text-lg tracking-tighter">─────&gt;</span>
                  </div>

                  {/* Step 2: Mint Token */}
                  <div className="md:col-span-2 p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex flex-col items-center gap-2.5 shadow-xl shadow-emerald-500/5 hover:border-emerald-500/60 transition-all">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wide">
                      {/* @ts-expect-error iconify-icon is a web component */}
                      <iconify-icon icon="lucide:key" className="text-sm" />
                      Mint Token
                    </div>
                    <span className="text-xs sm:text-sm font-black tracking-tight text-white bg-black/80 px-3.5 py-1.5 rounded-lg border border-emerald-500/30 shadow-inner">agnt.sr/x97b</span>
                    <span className="text-[11px] text-emerald-300 font-medium">28-Byte Scoped Reference</span>
                  </div>

                  {/* Arrow 2 */}
                  <div className="hidden md:flex flex-col items-center justify-center text-zinc-600">
                    <span className="text-[10px] uppercase text-zinc-500 font-semibold mb-1 tracking-wider">Handoff</span>
                    <span className="text-emerald-400 font-mono text-lg tracking-tighter">─────&gt;</span>
                  </div>

                  {/* Step 3: Resolve & Stream */}
                  <div className="md:col-span-2 p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col items-center gap-2.5 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold uppercase tracking-wide">
                      {/* @ts-expect-error iconify-icon is a web component */}
                      <iconify-icon icon="lucide:download-cloud" className="text-blue-400 text-base" />
                      Resolve &amp; Stream
                    </div>
                    <span className="text-[12px] text-zinc-300 font-semibold">Byte-range capable</span>
                    <span className="text-[10px] text-zinc-500">Target Agent Memory</span>
                  </div>
                </div>
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
                    <span className="text-xs mono text-zinc-400">agnt.sr/x97b</span>
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
                      <div className={`pl-6 ${jsonNodeClass("all")}`}><span className="json-key">&quot;id&quot;</span>: <span className="json-string">&quot;agnt_x97b&quot;</span>,</div>
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

          {/* Enterprise Trust Block: Zero Trust Architecture Bento Grid */}
          <section className="mt-44 w-full animate-reveal" style={{ animationDelay: "0.4s" }}>
            <div className="flex flex-col items-center text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold tracking-widest uppercase mb-4 text-emerald-400">
                Enterprise Trust &amp; Security
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">Zero Trust Architecture.</h2>
              <p className="text-zinc-400 text-base md:text-lg max-w-2xl">Privacy-first infrastructure that decouples your agent&apos;s state from the underlying LLM context window.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento 1: Local-first hashing */}
              <div className="bento-card rounded-2xl p-8 flex flex-col gap-10 relative overflow-hidden group border border-white/10 bg-[#0c0c0e]/90 hover:border-white/20 transition-all">
                <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/10 transition-colors duration-300">
                  {/* @ts-expect-error iconify-icon is a web component */}
                  <iconify-icon icon="lucide:hash" className="text-7xl" />
                </div>
                <div className="space-y-4 z-10">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                    {/* @ts-expect-error iconify-icon is a web component */}
                    <iconify-icon icon="lucide:shield-check" className="text-xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Local-first hashing</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Client-side checksum computation before transport. Every token is cryptographically signed and SHA-256 hashed locally in our SDK before leaving your infrastructure, ensuring data integrity is mathematically verified without server liability.</p>
                </div>
                <div className="mt-auto flex flex-col gap-2 z-10">
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] mono text-emerald-400 font-bold">
                    <span>CHECKSUM_VERIFIED</span>
                    {/* @ts-expect-error iconify-icon is a web component */}
                    <iconify-icon icon="lucide:check-circle" />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] mono text-zinc-400">
                    <span>SHA256: e3b0c4...a1b2</span>
                  </div>
                </div>
              </div>

              {/* Bento 2: Zero raw bytes read by the protocol */}
              <div className="bento-card rounded-2xl p-8 flex flex-col gap-10 relative overflow-hidden group border border-white/10 bg-[#0c0c0e]/90 hover:border-white/20 transition-all">
                <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/10 transition-colors duration-300">
                  {/* @ts-expect-error iconify-icon is a web component */}
                  <iconify-icon icon="lucide:eye-off" className="text-7xl" />
                </div>
                <div className="space-y-4 z-10">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
                    {/* @ts-expect-error iconify-icon is a web component */}
                    <iconify-icon icon="lucide:lock" className="text-xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Zero raw bytes read by the protocol</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Our backend stays a dumb, opaque, stateless pipe. By orchestrating secure S3 presigned streaming URLs, our servers never inspect, store, or buffer your file payload bytes—scaling infinitely with a minimal compliance surface.</p>
                </div>
                <div className="mt-auto glow-code mono text-[11px] text-zinc-400 border border-blue-500/20 bg-blue-950/10 p-3.5 rounded-lg z-10 leading-relaxed">
                  <span className="text-zinc-500">$</span> GET /api/resolve/x97b<br />
                  <span className="text-zinc-500">$</span> STATUS: <span className="text-emerald-400 font-bold">200 OK</span><br />
                  <span className="text-zinc-500">$</span> STREAM_URL: <span className="text-blue-300">amzn.s3.direct/...</span>
                </div>
              </div>

              {/* Bento 3: Storage stays in the user's bucket */}
              <div className="bento-card rounded-2xl p-8 flex flex-col gap-10 relative overflow-hidden group border border-white/10 bg-[#0c0c0e]/90 hover:border-white/20 transition-all">
                <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/10 transition-colors duration-300">
                  {/* @ts-expect-error iconify-icon is a web component */}
                  <iconify-icon icon="lucide:database" className="text-7xl" />
                </div>
                <div className="space-y-4 z-10">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
                    {/* @ts-expect-error iconify-icon is a web component */}
                    <iconify-icon icon="lucide:server" className="text-xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Storage stays in the user&apos;s bucket</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">Total enterprise data governance. Assets remain safely isolated within your organization&apos;s configured S3 or compatible object storage. You retain sovereign control over physical data boundaries, encryption keys, and retention TTLs.</p>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2 z-10">
                  {[
                    { icon: "logos:aws-s3", label: "AWS S3" },
                    { icon: "lucide:cloud", label: "Cloudflare R2", color: "text-orange-400" },
                    { icon: "lucide:hard-drive", label: "MinIO", color: "text-red-400" },
                    { icon: "lucide:shield", label: "Vercel Blob", color: "text-white" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-zinc-300">
                      {/* @ts-expect-error iconify-icon is a web component */}
                      <iconify-icon icon={item.icon} className={`text-sm ${item.color || ""}`} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Comparison Table */}
          <section className="mt-44 w-full max-w-4xl animate-reveal" style={{ animationDelay: "0.5s" }}>
            <div className="flex flex-col items-center text-center mb-14">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">Engineered for Multi-Agent Systems.</h2>
              <p className="text-zinc-400 text-base md:text-lg max-w-xl">Why teams move off raw storage buckets once agent handoffs scale beyond a prototype.</p>
            </div>
            <div className="subpixel-border rounded-2xl overflow-hidden bg-white/[0.02] border border-white/10 shadow-2xl">
              <div className="grid grid-cols-3 text-[12px] font-bold uppercase tracking-widest bg-white/[0.02]">
                <div className="p-5 text-zinc-600 border-b border-r border-white/10" />
                <div className="p-5 text-zinc-400 border-b border-r border-white/10 text-center sm:text-left">DIY S3 Buckets</div>
                <div className="p-5 text-emerald-400 border-b border-white/10 bg-emerald-500/10 text-center sm:text-left font-black">Agntshare Protocol</div>
              </div>
              {[
                ["TTL Enforcement", "Manual script cron jobs", "Native automated TTLs"],
                ["Cross-Framework Parsing", "Build custom adapters", "Automatic universal parsing"],
                ["Provenance Verification", "None (blind trust)", "Cryptographic SHA-256 Signatures"],
              ].map(([feature, diy, agnt], i) => (
                <div key={feature} className="grid grid-cols-3 text-sm hover:bg-white/[0.01] transition-colors">
                  <div className={`p-5 border-r ${i < 2 ? "border-b" : ""} border-white/10 font-bold text-zinc-200`}>{feature}</div>
                  <div className={`p-5 border-r ${i < 2 ? "border-b" : ""} border-white/10 text-zinc-400 text-xs sm:text-sm`}>{diy}</div>
                  <div className={`p-5 ${i < 2 ? "border-b" : ""} border-white/10 text-zinc-100 font-medium text-xs sm:text-sm flex items-center gap-2 bg-emerald-500/[0.02]`}>
                    {/* @ts-expect-error iconify-icon is a web component */}
                    <iconify-icon icon="lucide:check-circle-2" className="text-emerald-400 text-base shrink-0" /> {agnt}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* The "Why Now" Thesis */}
          <section className="mt-44 w-full max-w-4xl mx-auto text-center animate-reveal">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[11px] font-bold tracking-widest uppercase mb-6 text-emerald-400 shadow-lg shadow-emerald-500/5">
              The Why Now Thesis
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.15] mb-8 text-white">
              Model context windows are exploding. <br className="hidden sm:inline" />
              <span className="text-zinc-500">Raw payload handoffs are suffocating scaling.</span>
            </h2>
            <div className="p-8 md:p-10 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 shadow-2xl text-left sm:text-center">
              <p className="text-zinc-300 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto font-normal">
                While LLM context windows are expanding past 1M+ tokens, relying on raw prompt windows to pass large files, multi-page PDFs, and complex execution memory between autonomous agents creates an architectural bottleneck. Moving megabytes of raw JSON across LLM inference network boundaries creates crippling multi-second latency and astronomical token costs per hop.
              </p>
              <p className="text-emerald-400 font-bold text-lg md:text-xl mt-6">
                Compute is expensive; moving data through inference prompts is slow.
              </p>
              <p className="text-zinc-400 text-base md:text-lg mt-4 leading-relaxed max-w-2xl mx-auto">
                Agntshare solves this by decoupling state from the context window—letting agents hand off lightweight 28-byte cryptographically verified tokens instead of raw bytes.
              </p>
            </div>
          </section>

          {/* Benchmarks */}
          <section className="mt-44 w-full max-w-5xl animate-reveal">
            <div className="flex flex-col items-center text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold tracking-widest uppercase mb-4 text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Benchmarked, not marketed
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Raw Handoff vs. Agntshare Protocol.</h2>
              <p className="text-zinc-400 text-base md:text-lg max-w-xl">Same 4.2MB payload, same agents, two transport strategies. The efficiency delta compounds exponentially with every hop.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Latency / Hop", raw: "12.4s", agnt: "45ms", rawPct: 100, agntPct: 3 },
                { label: "Payload Size", raw: "4.2 MB", agnt: "28 Bytes", rawPct: 100, agntPct: 1 },
                { label: "Compute Cost", raw: "~$0.35", agnt: "$0.00", rawPct: 100, agntPct: 0, note: "Client-side S3 presign, edge routed." },
              ].map((b) => (
                <div key={b.label} className="bento-card rounded-2xl p-7 border border-white/10 bg-[#0c0c0e]/90 shadow-xl">
                  <div className="mono text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-6 flex items-center justify-between">
                    <span>{b.label}</span>
                    <span className="text-emerald-400 text-xs">100x+ Better</span>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-zinc-400 font-medium">Raw Context Handoff</span>
                      <span className="mono text-sm font-black text-red-400">{b.raw}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                      <div className="h-full rounded-full bg-red-500/80" style={{ width: `${b.rawPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-white font-bold">Agntshare Protocol</span>
                      <span className="mono text-sm font-black text-emerald-400">{b.agnt}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                      <div className="h-full rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" style={{ width: `${b.agntPct}%` }} />
                    </div>
                  </div>
                  {b.note && <div className="mt-5 text-[11px] font-semibold text-zinc-500 pt-3 border-t border-white/5">{b.note}</div>}
                </div>
              ))}
            </div>
          </section>

          {/* Ecosystem Marquee */}
          <section className="mt-44 w-full animate-reveal">
            <div className="flex flex-col items-center text-center mb-14 px-6">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-white">The Universal Translator for Agentic State.</h2>
              <p className="text-zinc-400 text-base md:text-lg max-w-xl">Tokens resolve identically regardless of the originating framework or programming language.</p>
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
                      <div key={`${set}-${item.name}`} className="logo-chip flex items-center gap-3 bg-white/[0.03] border border-white/10 px-5 py-2.5 rounded-xl shadow-md">
                        {/* @ts-expect-error iconify-icon is a web component */}
                        <iconify-icon icon={item.icon} className="text-2xl text-zinc-300" />
                        <span className="mono text-sm font-bold text-zinc-200">{item.name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Social Proof & Final CTA */}
          <section className="mt-44 w-full flex flex-col items-center text-center gap-8 animate-reveal">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Ready to unblock multi-agent scaling?
            </h2>
            <p className="text-zinc-400 text-lg tracking-wide max-w-xl">
              Join <span className="text-white font-bold underline decoration-emerald-500 decoration-2">400+</span> engineering teams building production AI workflows with Agntshare.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="bg-white text-black px-8 py-3.5 rounded-xl font-bold text-[15px] flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-white/10">
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
          <footer className="mt-44 w-full border-t border-white/10 pt-12 pb-12 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-6">
            <div className="flex items-center gap-3">
              <span className="font-bold tracking-tighter mono text-white text-sm">AGNT.SR</span>
              <span>© 2026 Agntshare Protocol Standards</span>
            </div>
            <div className="flex items-center gap-6 font-semibold">
              <a href="https://github.com/Deepak-githubuser24/agntshare" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://pypi.org/project/agntshare/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">PyPI</a>
              <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
              <span className="hover:text-white transition-colors cursor-default">MIT License</span>
            </div>
          </footer>

          {/* Legal Disclosure */}
          <footer className="w-full border-t border-white/5 py-8 text-center text-xs sm:text-sm text-zinc-500 leading-relaxed">
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
