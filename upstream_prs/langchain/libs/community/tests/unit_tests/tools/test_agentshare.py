import unittest
from unittest.mock import patch, MagicMock

from langchain_community.tools.agentshare.tool import (
    AgentShareShareTool,
    AgentShareResolveTool,
)

class TestAgentShareTools(unittest.TestCase):
    @patch("langchain_community.tools.agentshare.tool.requests.post")
    @patch("langchain_community.tools.agentshare.tool.requests.put")
    def test_share_tool(self, mock_put, mock_post):
        # Mock API responses
        mock_upload_resp = MagicMock()
        mock_upload_resp.status_code = 200
        mock_upload_resp.json.return_value = {
            "uploadUrl": "http://fake.upload.url",
            "assetId": "fake-asset-123"
        }
        
        mock_token_resp = MagicMock()
        mock_token_resp.status_code = 200
        mock_token_resp.json.return_value = {
            "token": "xyz123",
            "shareUrl": "http://agnt.sr/xyz123"
        }
        
        mock_post.side_effect = [mock_upload_resp, mock_token_resp]
        
        mock_put_resp = MagicMock()
        mock_put_resp.raise_for_status.return_value = None
        mock_put.return_value = mock_put_resp
        
        tool = AgentShareShareTool(api_key="fake-key", base_url="http://fake.base")
        result = tool._run(filename="test.txt", content="Hello AgentShare")
        
        self.assertIn("xyz123", result)
        self.assertEqual(mock_post.call_count, 2)
        self.assertEqual(mock_put.call_count, 1)

    @patch("langchain_community.tools.agentshare.tool.requests.get")
    def test_resolve_tool(self, mock_get):
        mock_resolve_resp = MagicMock()
        mock_resolve_resp.status_code = 200
        mock_resolve_resp.json.return_value = {
            "streamUrl": "http://fake.stream.url"
        }
        
        mock_content_resp = MagicMock()
        mock_content_resp.raise_for_status.return_value = None
        mock_content_resp.text = "Resolved content"
        
        mock_get.side_effect = [mock_resolve_resp, mock_content_resp]
        
        tool = AgentShareResolveTool(api_key="fake-key", base_url="http://fake.base")
        result = tool._run(token="xyz123")
        
        self.assertEqual(result, "Resolved content")
        self.assertEqual(mock_get.call_count, 2)
