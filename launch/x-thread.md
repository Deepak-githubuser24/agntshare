# X (Twitter) Thread — AgentShare Launch

---

**Tweet 1/7**

AI agents pass files to each other by dumping raw content into the context window.

No access control. No audit trail. No revocation. Just a 200KB JSON blob eating your token budget.

We built an infrastructure primitive to fix this.

---

**Tweet 2/7**

The math:

A 2MB JSON file ≈ 500K tokens.
At $0.01/1K input tokens, that's $5 per file pass.

If Agent A hands that file to Agent B, then B hands it to Agent C — you've spent $15 on context stuffing alone.

And none of those accesses are logged.

---

**Tweet 3/7**

AgentShare replaces the raw payload with a 4-character token:

upload → token → resolve → stream → audit → share

The agent passes "agnt.sr/x97b" instead of the file. 4 chars vs 500K tokens. Every resolve is logged.

---

**Tweet 4/7**

TypeScript SDK — 4 lines:

```ts
const client = new AgentShare({ apiKey });
const { assetId } = await client.upload({ filename: "data.json", contentType: "application/json", sizeBytes });
const { token } = await client.mintToken({ assetId });
const { streamUrl } = await client.resolve(token);
```

---

**Tweet 5/7**

Vercel AI SDK — give your agent a file-sharing tool:

```ts
import { createAgentShareTool } from "@agentshare/vercel-ai";

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: { agentShare: createAgentShareTool(client) },
});
```

The agent decides when to offload content. You get the audit log.

---

**Tweet 6/7**

Python / LangChain:

```python
from agentshare_langchain import AgentShareClient, create_agentshare_tools

client = AgentShareClient(api_key=key)
tools = create_agentshare_tools(client)
agent = create_tool_calling_agent(llm, tools, prompt)
```

Same primitive. Same audit trail. pip install agentshare-langchain.

---

**Tweet 7/7**

Three packages, one primitive:

→ @agentshare/sdk (TS core)
→ @agentshare/vercel-ai (AI SDK tool)
→ agentshare-langchain (Python)

Self-hostable. MIT licensed. Tokens are scoped and expire.

GitHub: github.com/agentshare/agentshare
Docs: docs.agentshare.dev
