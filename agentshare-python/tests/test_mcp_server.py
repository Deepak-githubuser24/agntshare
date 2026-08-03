"""
Test Suite for Agntshare Universal MCP Server tools.
"""

import json
import sys
import unittest

sys.path.insert(0, ".")

from agentshare.integrations.mcp_server import mint_pathway_token, resolve_pathway_token


class TestMCPServerTools(unittest.TestCase):

    def test_mint_pathway_token_tool(self):
        sample_payload = json.dumps({
            "agent": "MCP-Agent-01",
            "task": "Refactor billing system",
            "status": "completed"
        })

        res_str = mint_pathway_token(payload_json=sample_payload, framework="mcp_test")
        self.assertIn("State preserved securely. Pathway Token: agnt.sr/local_", res_str)

        # Extract token
        token_id = res_str.split("agnt.sr/")[1].strip()

        # Resolve token
        resolved_json_str = resolve_pathway_token(token_id=token_id)
        resolved_dict = json.loads(resolved_json_str)

        self.assertEqual(resolved_dict.get("agent"), "MCP-Agent-01")
        self.assertEqual(resolved_dict.get("task"), "Refactor billing system")

    def test_selective_resolve_pathway_token_tool(self):
        sample_payload = json.dumps({
            "summary": "Selective resolution test",
            "full_data": [1, 2, 3, 4, 5],
            "metrics": {"latency": "12ms"}
        })

        res_str = mint_pathway_token(payload_json=sample_payload, framework="mcp_test")
        token_id = res_str.split("agnt.sr/")[1].strip()

        # Selective resolve only 'summary' and 'metrics'
        resolved_json_str = resolve_pathway_token(token_id=token_id, keys=["summary", "metrics"])
        resolved_dict = json.loads(resolved_json_str)

        self.assertIn("summary", resolved_dict)
        self.assertIn("metrics", resolved_dict)
        self.assertNotIn("full_data", resolved_dict)

    def test_defensive_invalid_json(self):
        res = mint_pathway_token(payload_json="INVALID_JSON{")
        self.assertIn("[Agntshare Error] Invalid JSON payload string", res)


if __name__ == "__main__":
    unittest.main()
