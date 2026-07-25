"use client";

import { useState } from "react";

const TABS = [
  { id: "state", label: "TypeScript (Memory & State)" },
  { id: "file", label: "TypeScript (File Upload)" },
  { id: "mcp", label: "MCP (Claude / Cursor)" },
  { id: "vercel", label: "Vercel AI SDK" },
  { id: "langchain", label: "LangChain (Python)" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const CODE: Record<TabId, { install: string; code: string; note?: string }> = {
  state: {
    install: "npm install @agentshare/sdk",
    code: `import { AgentShare } from '@agentshare/sdk';

const client = new AgentShare({ apiKey: process.env.AGENTSHARE_API_KEY });

// 1. Share structured agent memory / project state
const { token, shareUrl } = await client.shareState({
  state: {
    summary: 'Refactored auth pipeline to SHA-256 API keys',
    decisions: ['Store hashed keys in PG', 'Support bearer token auth'],
    memory: { db: 'Postgres', cache: 'Redis' }
  }
});

// 2. Selectively retrieve ONLY the keys you need (saves prompt tokens!)
const { state } = await client.resolveState(token, { keys: ['summary', 'decisions'] });

console.log(state);
// → { summary: 'Refactored auth...', decisions: [...] }`,
    note: "High-level helper automatically handles JSON serialization, SHA-256 checksums, S3 uploads, and token minting in 3 lines of code."
  },
  file: {
    install: "npm install @agentshare/sdk",
    code: `import fs from 'fs';
import { AgentShare } from '@agentshare/sdk';

const client = new AgentShare({ apiKey: process.env.AGENTSHARE_API_KEY });

// 1. Initialize upload (opaque presigned URL)
const { uploadUrl, assetId } = await client.upload({
  filename: 'dataset.csv',
  contentType: 'text/csv',
  sizeBytes: fs.statSync('dataset.csv').size,
});

// 2. PUT directly to S3 storage
await fetch(uploadUrl, {
  method: 'PUT',
  body: fs.readFileSync('dataset.csv'),
});

// 3. Mint pathway token
const { token, shareUrl } = await client.mintToken({ assetId });

console.log(shareUrl);
// → https://agnt.sr/x97b`,
    note: "Zero server payload inspection — server acts as an opaque pipe using direct S3 presigned URLs."
  },
  mcp: {
    install: "npm install @agentshare/mcp-server",
    code: `// Add to claude_desktop_config.json or cursor.json:
{
  "mcpServers": {
    "agentshare": {
      "command": "npx",
      "args": ["tsx", "packages/mcp-server/src/index.ts"],
      "env": {
        "AGENTSHARE_API_KEY": "agnt_your_key_here"
      }
    }
  }
}

// Exposes tools automatically:
// - agentshare_share (content or state object)
// - agentshare_resolve (selective keys/path support)
// - agentshare_revoke (instant revocation)
// - Resource: agentshare://token/{id}`,
    note: "Standard Model Context Protocol (MCP) server. Works natively with Claude Desktop, Cursor, and VS Code."
  },
  vercel: {
    install: "npm install @agentshare/sdk @agentshare/vercel-ai ai @ai-sdk/openai",
    code: `import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { AgentShare } from '@agentshare/sdk';
import { createAgentShareTool } from '@agentshare/vercel-ai';

const client = new AgentShare({ apiKey: process.env.AGENTSHARE_API_KEY });

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Save our architecture decisions as a pathway token for the code agent.',
  tools: {
    agentShare: createAgentShareTool(client),
  },
});`,
  },
  langchain: {
    install: "pip install agentshare-langchain",
    code: `from agentshare_langchain import AgentShareClient, create_agentshare_tools
from langchain.agents import AgentExecutor

client = AgentShareClient(api_key='your-key')
tools = create_agentshare_tools(client)

agent_executor = AgentExecutor(
    agent=your_agent,
    tools=tools,
)`,
  },
};

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
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

export default function QuickstartPage() {
  const [active, setActive] = useState<TabId>("state");
  const current = CODE[active];

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-medium tracking-tight">Quickstart</h1>
      <p className="mt-3 text-[#9AA4B2]">
        Share and resolve agent memory, project state, or files in under 90 seconds.
      </p>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-1 rounded-lg border border-[#2A323C] bg-[#10151B] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
              active === tab.id
                ? "bg-[#5EEAD4]/10 text-[#5EEAD4]"
                : "text-[#9AA4B2] hover:text-[#EDEAE3]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Install */}
      <div className="mt-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
          1. Install
        </p>
        <CodeBlock lang="shell">{current.install}</CodeBlock>
      </div>

      {/* Code */}
      <div className="mt-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
          2. Code Example
        </p>
        <CodeBlock lang={active === "langchain" ? "python" : "typescript"}>
          {current.code}
        </CodeBlock>
        {current.note && (
          <p className="mt-2 text-xs text-[#5EEAD4]/80 italic font-mono">
            ℹ {current.note}
          </p>
        )}
      </div>

      {/* Highlights */}
      <div className="mt-10 rounded-lg border border-[#2A323C] bg-[#10151B] p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-[#5C6675]">
          Core Developer Guarantees
        </p>
        <ul className="mt-4 space-y-3 text-sm text-[#9AA4B2]">
          <li className="flex items-start gap-2">
            <span className="text-[#5EEAD4] font-bold">✓</span>
            <div>
              <strong className="text-[#EDEAE3]">Selective Retrieval:</strong> Request specific keys (e.g. <code className="text-[#5EEAD4]">keys: ['summary']</code>) or dot paths (<code className="text-[#5EEAD4]">path: 'memory.db'</code>) to prevent prompt token bloat.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#5EEAD4] font-bold">✓</span>
            <div>
              <strong className="text-[#EDEAE3]">Native MCP Server:</strong> Zero custom code needed for Claude Desktop, Cursor, or VS Code.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#5EEAD4] font-bold">✓</span>
            <div>
              <strong className="text-[#EDEAE3]">Security First:</strong> Opaque S3 storage, SHA-256 checksums, scopes (<code className="text-[#5EEAD4]">read</code> vs <code className="text-[#5EEAD4]">read_write</code>), instant token revocation, and agent identity audit logs.
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
