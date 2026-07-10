import os
import requests
from typing import Dict, Any, Optional

class AgentShareError(Exception):
    pass

class AgentShareClient:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or os.environ.get("AGENTSHARE_API_KEY", "")
        self.base_url = base_url or os.environ.get("AGENTSHARE_BASE_URL", "http://localhost:3000/api")

    def _headers(self) -> Dict[str, str]:
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            headers["x-user-id"] = self.api_key
        return headers

    def upload(self, filename: str, content_type: str, size_bytes: int) -> Dict[str, Any]:
        url = f"{self.base_url}/upload"
        res = requests.post(url, json={
            "filename": filename,
            "contentType": content_type,
            "sizeBytes": size_bytes
        }, headers=self._headers())
        
        if not res.ok:
            raise AgentShareError(f"Upload init failed: {res.text}")
        return res.json()

    def mint_token(self, asset_id: str, scope: str = "read") -> Dict[str, Any]:
        url = f"{self.base_url}/token"
        res = requests.post(url, json={
            "assetId": asset_id,
            "scope": scope
        }, headers=self._headers())
        
        if not res.ok:
            raise AgentShareError(f"Mint token failed: {res.text}")
        return res.json()

    def resolve(self, token: str) -> Dict[str, Any]:
        url = f"{self.base_url}/resolve/{token}"
        res = requests.get(url, headers=self._headers())
        
        if not res.ok:
            raise AgentShareError(f"Resolve token failed: {res.text}")
        return res.json()
