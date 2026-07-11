import os
import requests
from typing import Optional, Type, Dict, Any

from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool


class AgentShareShareSchema(BaseModel):
    """Input for AgentShare Share Tool."""

    filename: str = Field(
        description="The name of the file to share, e.g. 'context.md'."
    )
    content: str = Field(description="The actual string content to upload.")
    content_type: str = Field(
        default="text/plain", description="MIME type of the content, e.g. 'text/plain'."
    )


class AgentShareShareTool(BaseTool):
    """Tool to share content via AgentShare and get a short pathway token."""

    name: str = "agentshare_share"
    description: str = (
        "Share large text, code, or data output securely. "
        "Returns a short token (e.g. 'agnt.sr/xyz') that can be given to other agents."
    )
    args_schema: Type[BaseModel] = AgentShareShareSchema

    base_url: str = Field(
        default_factory=lambda: os.getenv("AGENTSHARE_BASE_URL", "https://api.agentshare.dev")
    )
    api_key: str = Field(
        default_factory=lambda: os.getenv("AGENTSHARE_API_KEY", "")
    )

    def _run(
        self,
        filename: str,
        content: str,
        content_type: str = "text/plain",
    ) -> str:
        if not self.api_key:
            return "Error: AGENTSHARE_API_KEY environment variable is missing."

        headers = {"Authorization": f"Bearer {self.api_key}"}

        # 1. Get upload URL
        upload_resp = requests.post(
            f"{self.base_url}/api/upload",
            json={
                "filename": filename,
                "contentType": content_type,
                "sizeBytes": len(content.encode("utf-8")),
            },
            headers=headers,
        )
        if upload_resp.status_code != 200:
            return f"Error: Upload failed with status {upload_resp.status_code}. {upload_resp.text}"

        data = upload_resp.json()
        upload_url = data["uploadUrl"]
        asset_id = data["assetId"]

        # 2. Upload content
        put_resp = requests.put(
            upload_url,
            data=content.encode("utf-8"),
            headers={"Content-Type": content_type},
        )
        put_resp.raise_for_status()

        # 3. Mint token
        token_resp = requests.post(
            f"{self.base_url}/api/token",
            json={"assetId": asset_id, "scope": "read"},
            headers=headers,
        )
        if token_resp.status_code != 200:
            return f"Error: Token mint failed with status {token_resp.status_code}. {token_resp.text}"

        token_data = token_resp.json()
        return f"Successfully shared. Access token URL: {token_data['shareUrl']} (Token: {token_data['token']})"


class AgentShareResolveSchema(BaseModel):
    """Input for AgentShare Resolve Tool."""

    token: str = Field(
        description="The short AgentShare token to resolve, e.g. 'xyz123'."
    )


class AgentShareResolveTool(BaseTool):
    """Tool to read content shared via an AgentShare token."""

    name: str = "agentshare_resolve"
    description: str = (
        "Reads content from a given AgentShare token. "
        "Use this when another agent passes you an agnt.sr token."
    )
    args_schema: Type[BaseModel] = AgentShareResolveSchema

    base_url: str = Field(
        default_factory=lambda: os.getenv("AGENTSHARE_BASE_URL", "https://api.agentshare.dev")
    )
    api_key: str = Field(
        default_factory=lambda: os.getenv("AGENTSHARE_API_KEY", "")
    )

    def _run(self, token: str) -> str:
        if not self.api_key:
            return "Error: AGENTSHARE_API_KEY environment variable is missing."
        
        headers = {"Authorization": f"Bearer {self.api_key}"}

        # 1. Resolve token
        resolve_resp = requests.get(
            f"{self.base_url}/api/resolve/{token}",
            headers=headers,
        )
        if resolve_resp.status_code != 200:
            return f"Error: Resolve failed with status {resolve_resp.status_code}. {resolve_resp.text}"

        data = resolve_resp.json()
        stream_url = data["streamUrl"]

        # 2. Fetch content
        content_resp = requests.get(stream_url)
        content_resp.raise_for_status()

        return content_resp.text
