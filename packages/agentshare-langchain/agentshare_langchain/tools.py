import requests
from typing import Type
from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool
from .client import AgentShareClient

class ShareContentInput(BaseModel):
    filename: str = Field(description="The name of the file to create (e.g. 'summary.txt', 'data.json')")
    content: str = Field(description="The raw text content to write to the file")
    content_type: str = Field(default="text/plain", description="The MIME type of the file")

class AgentShareShareTool(BaseTool):
    name: str = "agentshare_share"
    description: str = (
        "Use this tool to share text or files securely by uploading them to AgentShare "
        "and generating a short pathway token instead of returning the entire text. "
        "Returns the short URL to provide to the user."
    )
    args_schema: Type[BaseModel] = ShareContentInput
    client: AgentShareClient = None

    def __init__(self, client: AgentShareClient, **kwargs):
        super().__init__(**kwargs)
        self.client = client

    def _run(self, filename: str, content: str, content_type: str = "text/plain") -> str:
        content_bytes = content.encode("utf-8")
        
        # 1. Init upload
        upload_data = self.client.upload(filename, content_type, len(content_bytes))
        
        # 2. Upload to storage
        upload_res = requests.put(
            upload_data["uploadUrl"],
            data=content_bytes,
            headers={"Content-Type": content_type}
        )
        if not upload_res.ok:
            return f"Error: Failed to upload file to storage ({upload_res.status_code})"

        # 3. Mint token
        token_data = self.client.mint_token(upload_data["assetId"])
        
        return f"Successfully shared {filename}. Token URL: {token_data['shareUrl']}"


class ResolveTokenInput(BaseModel):
    token: str = Field(description="The short pathway token to resolve (e.g., 'x97b')")

class AgentShareResolveTool(BaseTool):
    name: str = "agentshare_resolve"
    description: str = (
        "Use this tool to read the contents of an AgentShare token. "
        "Returns the raw text content of the file."
    )
    args_schema: Type[BaseModel] = ResolveTokenInput
    client: AgentShareClient = None

    def __init__(self, client: AgentShareClient, **kwargs):
        super().__init__(**kwargs)
        self.client = client

    def _run(self, token: str) -> str:
        # 1. Resolve token
        resolve_data = self.client.resolve(token)
        
        # 2. Fetch content
        fetch_res = requests.get(resolve_data["streamUrl"])
        if not fetch_res.ok:
            return f"Error: Failed to fetch file content ({fetch_res.status_code})"
            
        return fetch_res.text


def create_agentshare_tools(client: AgentShareClient):
    return [
        AgentShareShareTool(client=client),
        AgentShareResolveTool(client=client)
    ]
