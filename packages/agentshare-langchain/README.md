# agentshare-langchain

The official LangChain Python integration for AgentShare.

Turn AgentShare into a first-class tool for your LangChain agents. Give them the ability to securely write artifacts (code, JSON, large text) to memory and return short pathway tokens (`agnt.sr/x97b`) instead of blasting your context window.

## Installation

```bash
pip install agentshare-langchain langchain
```

## Quickstart (Under 60 Seconds)

```python
import os
from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate
from agentshare_langchain import AgentShareClient, create_agentshare_tools

# 1. Initialize the core SDK client
client = AgentShareClient(
    api_key=os.environ.get("AGENTSHARE_API_KEY", "test-user-id"),
    base_url="http://localhost:3000/api" # Optional, defaults to hosted
)

# 2. Get the LangChain tools
tools = create_agentshare_tools(client)

# 3. Initialize your agent
llm = ChatOpenAI(model="gpt-4o")
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant. Use tools when needed."),
    ("placeholder", "{chat_history}"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 4. Watch the agent share files instead of polluting context
response = agent_executor.invoke({
    "input": "Write a massive JSON report about space and save it to agentshare."
})

print(response["output"])
# Output: "I have generated the space report and saved it. You can access it securely here: agnt.sr/r82q"
```
