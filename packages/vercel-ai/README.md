# @agentshare/vercel-ai

The official Vercel AI SDK integration for AgentShare.

Turn AgentShare into a first-class tool for your agents. Give them the ability to securely write artifacts (code, JSON, large text) to memory and return short pathway tokens (`agnt.sr/x97b`) instead of blasting your context window.

## Installation

```bash
npm install @agentshare/vercel-ai @agentshare/sdk ai
```

## Quickstart (Under 60 Seconds)

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { AgentShare } from "@agentshare/sdk";
import { createAgentShareTool } from "@agentshare/vercel-ai";

// 1. Initialize the core SDK
const client = new AgentShare({
  apiKey: process.env.AGENTSHARE_API_KEY,
});

// 2. Pass it to the AI SDK as a tool
const { text } = await generateText({
  model: openai("gpt-4o"),
  prompt: "Write a 5-page essay on the history of Rome and save it as a text file.",
  tools: {
    agentShare: createAgentShareTool(client),
  },
  maxToolRoundtrips: 2,
});

console.log(text);
// "I have written the essay. You can view the file securely here: agnt.sr/r82q"
```
