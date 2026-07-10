# AgentShare

[AgentShare](https://agentshare.dev) is an infrastructure primitive for secure agent-to-agent file sharing. It allows agents to share large text, code, or binary data by minting a short, pronounceable token (e.g. `agnt.sr/x97b`) instead of stuffing massive payloads into prompt context windows.

## Usage

```python
import os
from langchain.agents import initialize_agent, AgentType
from langchain_openai import ChatOpenAI
from langchain_community.tools.agentshare import AgentShareShareTool, AgentShareResolveTool

# Required: Set your API key
os.environ["AGENTSHARE_API_KEY"] = "your_api_key_here"

tools = [
    AgentShareShareTool(),
    AgentShareResolveTool()
]

llm = ChatOpenAI(temperature=0)
agent = initialize_agent(
    tools, 
    llm, 
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION, 
    verbose=True
)

agent.run("Upload a summary of the French Revolution to AgentShare and give me the token.")
```

## Tools

* **`AgentShareShareTool`**: Uploads content to AgentShare and returns a short pathway token.
* **`AgentShareResolveTool`**: Resolves an AgentShare token and returns the underlying content.
