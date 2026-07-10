function CodeBlock({
  children,
  lang,
}: {
  children: string;
  lang?: string;
}) {
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

export default function IntegrationsPage() {
  return (
    <div className="max-w-3xl space-y-14">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Integrations</h1>
        <p className="mt-3 text-[#9AA4B2]">
          Drop AgentShare into your existing agent framework with a single tool
          binding.
        </p>
      </div>

      {/* Vercel AI SDK */}
      <section>
        <h2 className="flex items-center gap-3 text-xl font-medium tracking-tight">
          <span className="rounded bg-[#5EEAD4]/10 px-2 py-1 font-mono text-xs text-[#5EEAD4]">
            vercel ai
          </span>
          Vercel AI SDK
        </h2>
        <p className="mt-3 text-sm text-[#9AA4B2]">
          The <code className="text-[#EDEAE3]">@agentshare/vercel-ai</code>{" "}
          package exposes a single function,{" "}
          <code className="text-[#EDEAE3]">createAgentShareTool</code>, that
          returns a Vercel AI SDK-compatible tool definition. The model can call
          it to upload files and mint share tokens autonomously.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
              1. Install
            </p>
            <CodeBlock lang="shell">
              npm install @agentshare/sdk @agentshare/vercel-ai
            </CodeBlock>
          </div>

          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
              2. Create the tool
            </p>
            <CodeBlock lang="typescript">{`import { AgentShare } from '@agentshare/sdk';
import { createAgentShareTool } from '@agentshare/vercel-ai';

const client = new AgentShare({
  apiKey: process.env.AGENTSHARE_API_KEY,
});

const tool = createAgentShareTool(client);`}</CodeBlock>
          </div>

          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
              3. Pass to generateText
            </p>
            <CodeBlock lang="typescript">{`import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Save the analysis report.',
  tools: {
    agentShare: tool,
  },
});`}</CodeBlock>
          </div>
        </div>
      </section>

      {/* LangChain */}
      <section>
        <h2 className="flex items-center gap-3 text-xl font-medium tracking-tight">
          <span className="rounded bg-[#5EEAD4]/10 px-2 py-1 font-mono text-xs text-[#5EEAD4]">
            python
          </span>
          LangChain
        </h2>
        <p className="mt-3 text-sm text-[#9AA4B2]">
          The <code className="text-[#EDEAE3]">agentshare-langchain</code>{" "}
          package provides{" "}
          <code className="text-[#EDEAE3]">create_agentshare_tools</code> which
          returns a list of LangChain-compatible{" "}
          <code className="text-[#EDEAE3]">BaseTool</code> instances ready to
          pass to any agent executor.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
              1. Install
            </p>
            <CodeBlock lang="shell">pip install agentshare-langchain</CodeBlock>
          </div>

          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
              2. Create client and tools
            </p>
            <CodeBlock lang="python">{`from agentshare_langchain import AgentShareClient, create_agentshare_tools

client = AgentShareClient(api_key='your-key')
tools = create_agentshare_tools(client)`}</CodeBlock>
          </div>

          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#5C6675]">
              3. Pass to AgentExecutor
            </p>
            <CodeBlock lang="python">{`from langchain.agents import AgentExecutor

agent_executor = AgentExecutor(
    agent=your_agent,
    tools=tools,
    verbose=True,
)

result = agent_executor.invoke({
    "input": "Upload the report and share it with the review agent."
})`}</CodeBlock>
          </div>
        </div>
      </section>
    </div>
  );
}
