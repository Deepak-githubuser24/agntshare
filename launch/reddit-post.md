# I built an infrastructure primitive for AI agents to share files without destroying context windows

**Subreddits:** r/LocalLLaMA, r/MachineLearning

---

I kept hitting the same problem building multi-agent systems: agents need to pass files to each other, and the default approach — just dump the content into the next prompt — is terrible.

**Why it's terrible:**

A 2MB JSON file is roughly 500K tokens. At $0.01/1K input tokens, every file pass costs about $5. Chain three agents together and you've spent $15 passing one document around. And that's before you consider latency, truncation risk, or the fact that you have zero record of which agent accessed what.

There's no access control. No revocation. No audit trail. Just raw bytes in a prompt.

**What I built:**

AgentShare is a primitive with six steps:

```
upload → token → resolve → stream → audit → share
```

Instead of embedding the file in the prompt, the sending agent uploads it to S3-compatible storage, gets back a short scoped token (`agnt.sr/x97b`), and passes that 4-character token to the next agent. The receiving agent resolves the token into a presigned stream URL and fetches directly from storage. Every access is logged.

Tokens support scopes (`read`, `read_write`, `admin`), configurable TTL, and revocation.

**Code (TypeScript):**

```typescript
import { AgentShare } from "@agentshare/sdk";

const client = new AgentShare({ apiKey: process.env.AGENTSHARE_API_KEY });
const { uploadUrl, assetId } = await client.upload({
  filename: "report.json",
  contentType: "application/json",
  sizeBytes: buffer.byteLength,
});
await fetch(uploadUrl, { method: "PUT", body: buffer });
const { token } = await client.mintToken({ assetId, scope: "read" });
// Pass `token` to the next agent — 4 chars instead of 500K tokens
```

**Vercel AI SDK — agent decides when to offload:**

```typescript
import { createAgentShareTool } from "@agentshare/vercel-ai";

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: { agentShare: createAgentShareTool(client) },
});
```

**LangChain (Python):**

```python
from agentshare_langchain import AgentShareClient, create_agentshare_tools

client = AgentShareClient(api_key=os.environ["AGENTSHARE_API_KEY"])
tools = create_agentshare_tools(client)
executor = AgentExecutor(agent=agent, tools=tools)
```

**Stack:** Next.js API routes, PostgreSQL (token state + append-only audit log), any S3-compatible object store. Self-hostable. MIT licensed.

**Three packages:**
- `@agentshare/sdk` — Core TypeScript client
- `@agentshare/vercel-ai` — Vercel AI SDK tool
- `agentshare-langchain` — LangChain Python integration

GitHub: https://github.com/agentshare/agentshare
Docs: https://docs.agentshare.dev

Interested in feedback on the token scoping model — is `read | read_write | admin` granular enough for real multi-agent pipelines? What access patterns are you running into?
