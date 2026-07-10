"""
AgentShare Demo: LangChain Tool

Shows how a LangChain agent uses AgentShare to persist artifacts
and return short pathway tokens instead of raw file content.

Run: python examples/langchain-tool.py
"""

import sys
sys.path.insert(0, "packages/agentshare-langchain")

from agentshare_langchain import AgentShareClient, create_agentshare_tools

def main():
    client = AgentShareClient(
        api_key="demo-user",
        base_url="http://localhost:3000/api"
    )

    tools = create_agentshare_tools(client)
    share_tool = next(t for t in tools if t.name == "agentshare_share")
    resolve_tool = next(t for t in tools if t.name == "agentshare_resolve")

    print("\n┌─ Share Tool ─────────────────────────────────")
    print("│  Simulating agent saving a research report")

    result = share_tool.invoke({
        "filename": "research.json",
        "content": '{"topic": "quantum computing", "papers_reviewed": 42}',
        "content_type": "application/json"
    })

    print(f"│  Result: {result}")
    print("└──────────────────────────────────────────────\n")

    # Extract token from result for resolve demo
    if "Token URL:" in result:
        token = result.split("/")[-1]
        print("┌─ Resolve Tool ───────────────────────────────")
        print(f"│  Resolving token: {token}")

        resolve_result = resolve_tool.invoke({"token": token})
        print(f"│  Content: {resolve_result[:100]}...")
        print("└──────────────────────────────────────────────\n")

    print("✓ LangChain tool demo complete")

if __name__ == "__main__":
    main()
