"use client";

import { useState } from "react";

const TABS = [
  { id: "sdk", label: "TypeScript SDK" },
  { id: "vercel", label: "Vercel AI SDK" },
  { id: "langchain", label: "LangChain Python" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ------------------------------------------------------------------ */
/* Code blocks — raw strings, no interpolation                        */
/* ------------------------------------------------------------------ */

const CODE: Record<TabId, { install: string; code: string }> = {
  sdk: {
    install: "npm install @agentshare/sdk",
    code: `import fs from 'fs';
import { AgentShare } from '@agentshare/sdk';

const client = new AgentShare({
  apiKey: process.env.AGENTSHARE_API_KEY,
});

// 1. Get a presigned upload URL
const { uploadUrl, assetId } = await client.upload({
  filename: 'context.json',
  contentType: 'application/json',
  sizeBytes: fs.statSync('context.json').size,
});

// 2. PUT the file directly to storage
await fetch(uploadUrl, {
  method: 'PUT',
  body: fs.readFileSync('context.json'),
});

// 3. Mint a share token
const { shareUrl } = await client.mintToken({ assetId });

console.log(shareUrl);
// → https://agnt.sr/x97b`,
  },
  vercel: {
    install: "npm install @agentshare/sdk @agentshare/vercel-ai ai @ai-sdk/openai",
    code: `import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { AgentShare } from '@agentshare/sdk';
import { createAgentShareTool } from '@agentshare/vercel-ai';

const client = new AgentShare({
  apiKey: process.env.AGENTSHARE_API_KEY,
});

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Save the analysis report.',
  tools: {
    agentShare: createAgentShareTool(client),
  },
});`,
  },
  langchain: {
    install: "pip install agentshare-langchain",
    code: `from agentshare_langchain import AgentShareClient, create_agentshare_tools

client = AgentShareClient(api_key='your-key')
tools = create_agentshare_tools(client)

# Pass tools to your agent executor
from langchain.agents import AgentExecutor

agent_executor = AgentExecutor(
    agent=your_agent,
    tools=tools,
)`,
  },
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

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
  const [active, setActive] = useState<TabId>("sdk");

  const current = CODE[active];

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-medium tracking-tight">Quickstart</h1>
      <p className="mt-3 text-[#9AA4B2]">
        Upload a file and mint a share token in under 10 lines of code.
      </p>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 rounded-lg border border-[#2A323C] bg-[#10151B] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`rounded-md px-4 py-2 font-mono text-xs transition-colors ${
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
          Install
        </p>
        <CodeBlock lang="shell">{current.install}</CodeBlock>
      </div>

      {/* Code */}
      <div className="mt-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
          Usage
        </p>
        <CodeBlock lang={active === "langchain" ? "python" : "typescript"}>
          {current.code}
        </CodeBlock>
      </div>

      {/* What happens */}
      <div className="mt-10 rounded-lg border border-[#2A323C] bg-[#10151B] p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-[#5C6675]">
          What happens under the hood
        </p>
        <ol className="mt-4 space-y-3 text-sm text-[#9AA4B2]">
          <li>
            <span className="font-mono text-[#5EEAD4]">upload</span> —
            Returns a presigned URL and an{" "}
            <code className="text-[#EDEAE3]">assetId</code>.
          </li>
          <li>
            <span className="font-mono text-[#5EEAD4]">PUT</span> — Your
            code uploads the file directly to object storage (S3 / MinIO).
          </li>
          <li>
            <span className="font-mono text-[#5EEAD4]">mintToken</span> —
            Creates a short, scoped, expiring share URL.
          </li>
          <li>
            <span className="font-mono text-[#5EEAD4]">resolve</span> — Any
            agent with the token can stream the asset.
          </li>
        </ol>
      </div>
    </div>
  );
}
