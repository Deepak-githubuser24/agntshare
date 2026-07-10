import os
from agentshare_langchain import AgentShareClient, create_agentshare_tools

# Mocking LangChain imports for the standalone example script without requiring full LLM setup
class MockAgentExecutor:
    def __init__(self, tools):
        self.tools = tools
        self.share_tool = next(t for t in tools if t.name == "agentshare_share")
        
    def simulate_llm_tool_call(self, filename, content):
        print(f"Agent decided to call tool: {self.share_tool.name}")
        print(f"Tool description: {self.share_tool.description}")
        result = self.share_tool.invoke({"filename": filename, "content": content})
        return result

def run_example():
    print("1. Initializing AgentShare client...")
    client = AgentShareClient(
        api_key="test-user-id",
        base_url="http://localhost:3000/api"
    )

    print("2. Creating LangChain tools...")
    tools = create_agentshare_tools(client)
    
    print("3. Simulating Agent Execution...")
    executor = MockAgentExecutor(tools)
    
    response = executor.simulate_llm_tool_call(
        filename="report.json",
        content='{"analysis": "complete", "result": 42}'
    )
    
    print("\n--- Agent Tool Result ---")
    print(response)

if __name__ == "__main__":
    run_example()
