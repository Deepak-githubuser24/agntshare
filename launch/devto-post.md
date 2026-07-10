# Why Your AI Agent Shouldn't Pass Raw Files Through the Prompt Window

## The hidden cost of context window stuffing

Here's a pattern that ships in almost every multi-agent system today: Agent A generates a JSON report, then passes the raw content to Agent B through the prompt.

It works. It's also quietly expensive.

A 2MB JSON payload is roughly 500,000 tokens. At current API pricing ($0.01 per 1K input tokens for models like GPT-4o), that single file pass costs **$5.00**. If the orchestrator routes that payload through three agents sequentially — a common pattern in research/analysis pipelines — you're spending **$15 in context costs** for one document.

But cost isn't even the worst problem. The real issues:

1. **Latency.** Prefilling 500K tokens adds seconds of processing time per agent invocation. For pipelines with 5+ agents, this compounds fast.
2. **Truncation risk.** Context windows have hard limits. A 2MB file might silently truncate, causing the agent to operate on partial data with no indication anything was lost.
3. **Zero auditability.** There's no record of which agent accessed which file, when, or with what permissions. In a production system, this is a non-starter for compliance and debugging.
4. **No revocation.** Once the content is in the prompt, you can't un-share it. If an agent's session is compromised, the data is exposed.

## The infrastructure primitive

AgentShare is an infrastructure layer that replaces raw file passing with a six-step primitive:

```
upload → token → resolve → stream → audit → share
```

Instead of embedding a 2MB file in the prompt, the sending agent uploads it to object storage, receives a scoped token (4 characters, e.g., `agnt.sr/x97b`), and passes *that token* in the context. The receiving agent resolves the token into a presigned stream URL, fetches the content directly from storage, and every access is logged to an append-only audit table.

The context window cost drops from 500K tokens to ~10 tokens (the token string plus minimal framing). That's a **50,000x reduction**.

## TypeScript SDK: @agentshare/sdk

The core client handles upload initialization, token minting, and resolution:

```typescript
import { AgentShare } from "@agentshare/sdk";

const client = new AgentShare({
  apiKey: process.env.AGENTSHARE_API_KEY,
});

// Upload
const { uploadUrl, assetId } = await client.upload({
  filename: "analysis.json",
  contentType: "application/json",
  sizeBytes: buffer.byteLength,
});
await fetch(uploadUrl, { method: "PUT", body: buffer });

// Mint a scoped, expiring token
const { token, shareUrl } = await client.mintToken({
  assetId,
  scope: "read",       // read | read_write | admin
  ttlSeconds: 3600,    // expires in 1 hour
});

// On the receiving agent — resolve and stream
const { streamUrl, filename } = await client.resolve(token);
const data = await fetch(streamUrl).then(r => r.json());
```

Tokens are scoped (`read`, `read_write`, `admin`), have configurable TTL, and can be revoked. Every `upload`, `mint`, `resolve`, and `revoke` event is written to the `audit_logs` table with the actor, IP, timestamp, and metadata.

## Vercel AI SDK integration: @agentshare/vercel-ai

If you're using the Vercel AI SDK, you can give your agent file-sharing as a tool. The agent decides when to offload content:

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { AgentShare } from "@agentshare/sdk";
import { createAgentShareTool } from "@agentshare/vercel-ai";

const client = new AgentShare({ apiKey: process.env.AGENTSHARE_API_KEY });

const { text } = await generateText({
  model: openai("gpt-4o"),
  prompt: "Generate a detailed performance report and save it.",
  tools: {
    agentShare: createAgentShareTool(client),
  },
  maxToolRoundtrips: 2,
});
// Agent response: "Report saved. Access it here: agnt.sr/r82q"
```

The tool exposes two actions: `share` (upload content and return a token) and `resolve` (read content from an existing token). The agent calls them as standard tool invocations — no custom plumbing required.

## LangChain integration: agentshare-langchain

For Python agents built on LangChain:

```python
from agentshare_langchain import AgentShareClient, create_agentshare_tools
from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate

client = AgentShareClient(api_key=os.environ["AGENTSHARE_API_KEY"])
tools = create_agentshare_tools(client)

llm = ChatOpenAI(model="gpt-4o")
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant. Use tools when needed."),
    ("placeholder", "{chat_history}"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
response = executor.invoke({"input": "Write a data report and share it."})
# Output: "Report saved to agnt.sr/r82q"
```

`create_agentshare_tools()` returns two LangChain `BaseTool` subclasses: `agentshare_share` and `agentshare_resolve`, with Pydantic schemas for argument validation.

## Architecture

The stack is deliberately simple:

- **API layer:** Next.js API routes handling upload init, token minting, and resolution
- **Storage:** Any S3-compatible object store (MinIO for local dev, AWS S3 / Cloudflare R2 / Backblaze B2 in production)
- **Database:** PostgreSQL — `pathway_tokens` for token state, `audit_logs` for the append-only event log, `assets` for file metadata
- **Auth:** Pluggable — Auth.js with mock credentials locally, swap in Clerk/Auth0/GitHub for production

Tokens are JWT-like short strings that resolve through the API. Presigned URLs mean the file content never passes through the API server on read — the agent streams directly from the object store.

## Get started

```bash
npm install @agentshare/sdk        # Core TS client
npm install @agentshare/vercel-ai  # Vercel AI SDK tool
pip install agentshare-langchain   # LangChain Python
```

Self-hostable. MIT licensed.

- Docs: [docs.agentshare.dev](https://docs.agentshare.dev)
- GitHub: [github.com/agentshare/agentshare](https://github.com/agentshare/agentshare)
