"""
Test Harness for AgentShare LangChain Callback Handler.
Demonstrates 1-line integration via RunnableConfig and tests defensive exception handling.
"""

import sys
import unittest
from unittest.mock import MagicMock

# Insert local agentshare-python package path
sys.path.insert(0, ".")

from agentshare import AgentShareClient
from agentshare.integrations.langchain import AgentShareCallbackHandler


class MockAgentFinish:
    """Mock LangChain AgentFinish object."""

    def __init__(self, return_values: dict):
        self.return_values = return_values


class MockLangChainChain:
    """Mock LCEL Runnable Chain demonstrating 1-line callback registration."""

    def __init__(self, output: dict):
        self.output = output

    def invoke(self, input_data: dict, config: dict = None) -> dict:
        callbacks = (config or {}).get("callbacks", [])
        
        # Simulate chain completion event call to registered callbacks
        for cb in callbacks:
            if hasattr(cb, "on_chain_end"):
                cb.on_chain_end(self.output, run_id="run-101", parent_run_id=None)

        return self.output


class TestLangChainHook(unittest.TestCase):

    def setUp(self):
        self.mock_client = MagicMock(spec=AgentShareClient)
        self.mock_client.mint_pathway_token.return_value = "mock_tkn_8899"
        self.handler = AgentShareCallbackHandler(client=self.mock_client, ttl_seconds=3600)

    def test_on_agent_finish_interception(self):
        finish_event = MockAgentFinish(
            return_values={"output": "Refactored payment pipeline to async queue"}
        )
        self.handler.on_agent_finish(finish_event, run_id="run-1")
        
        self.mock_client.mint_pathway_token.assert_called_once()
        _, kwargs = self.mock_client.mint_pathway_token.call_args
        self.assertEqual(kwargs["framework"], "langchain")
        self.assertEqual(kwargs["scope"], "read")
        self.assertEqual(self.handler.last_token, "mock_tkn_8899")

    def test_on_chain_end_lcel_runnable_config(self):
        chain = MockLangChainChain(
            output={"summary": "Agent workflow executed successfully", "status": "completed"}
        )
        
        # 1-Line RunnableConfig integration: config={"callbacks": [handler]}
        config = {"callbacks": [self.handler]}
        result = chain.invoke({"input": "Run pipeline"}, config=config)

        self.assertEqual(result["status"], "completed")
        self.mock_client.mint_pathway_token.assert_called()
        self.assertEqual(self.handler.last_token, "mock_tkn_8899")

    def test_defensive_exception_swallowing(self):
        # Configure client to raise network/API error
        failing_client = MagicMock(spec=AgentShareClient)
        failing_client.mint_pathway_token.side_effect = Exception("Simulated S3 network failure")
        defensive_handler = AgentShareCallbackHandler(client=failing_client)

        chain = MockLangChainChain(output={"result": "data"})
        
        # Must NOT raise exception despite internal mint_pathway_token failure
        try:
            res = chain.invoke({"input": "test"}, config={"callbacks": [defensive_handler]})
            self.assertEqual(res["result"], "data")
        except Exception as e:
            self.fail(f"AgentShareCallbackHandler raised exception instead of swallowing: {e}")


if __name__ == "__main__":
    unittest.main()
