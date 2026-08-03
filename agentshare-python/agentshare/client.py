"""
AgentShareClient — Zero-dependency Python client for Agntshare Pathway Tokens.
Uses standard library urllib.request and json for zero-friction environment portability.
Supports both cloud mode (S3/API) and local sandbox mode (offline zero-config testing).
"""

import hashlib
import hmac
import json
import os
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional


class AgentShareError(Exception):
    """Base exception raised for AgentShare API or SDK errors."""

    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details

    def __str__(self) -> str:
        if self.status_code:
            return f"[AgentShare Error {self.status_code}] {self.message}"
        return f"[AgentShare Error] {self.message}"


class AgentShareClient:
    """
    Official Zero-Dependency Python Client for Agntshare.
    
    Provides high-speed, verifiable pathway token minting, selective resolution,
    and access revocation across AI agent frameworks. Supports local sandbox mode
    for zero-config offline development.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        agent_id: Optional[str] = None,
        session_id: Optional[str] = None,
        agent_role: Optional[str] = None,
        mode: str = "cloud",
    ):
        self.mode = mode.lower() if mode in ["cloud", "local"] else os.environ.get("AGENTSHARE_MODE", "cloud").lower()
        self.api_key = (
            api_key
            or os.environ.get("AGENTSHARE_API_KEY")
            or "as_e2etestkey_for_local_development_only_do_not_use_in_prod"
        )
        
        raw_base_url = (
            base_url
            or os.environ.get("AGENTSHARE_BASE_URL")
            or "http://127.0.0.1:3000/api"
        )
        self.base_url = raw_base_url.replace("localhost", "127.0.0.1").rstrip("/")
        if not self.base_url.endswith("/api"):
            self.base_url = f"{self.base_url}/api"

        self.agent_id = agent_id or os.environ.get("AGENTSHARE_AGENT_ID")
        self.session_id = session_id or os.environ.get("AGENTSHARE_SESSION_ID")
        self.agent_role = agent_role or os.environ.get("AGENTSHARE_AGENT_ROLE") or "python-sdk"

        # Local sandbox directory
        self.local_dir = os.path.join(tempfile.gettempdir(), ".agntshare")
        if self.mode == "local" and not os.path.exists(self.local_dir):
            os.makedirs(self.local_dir, exist_ok=True)

    def _request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None,
        raw_body: Optional[bytes] = None,
        content_type: str = "application/json",
        custom_headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Internal helper to send HTTP requests using urllib.request."""
        url = f"{self.base_url}{endpoint}" if endpoint.startswith("/") else endpoint
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": content_type,
            "User-Agent": "agentshare-python/1.0.0",
        }

        if self.agent_id:
            headers["x-agent-id"] = self.agent_id
        if self.session_id:
            headers["x-session-id"] = self.session_id
        if self.agent_role:
            headers["x-agent-role"] = self.agent_role

        if custom_headers:
            headers.update(custom_headers)

        payload_bytes: Optional[bytes] = None
        if raw_body is not None:
            payload_bytes = raw_body
        elif data is not None:
            payload_bytes = json.dumps(data).encode("utf-8")

        req = urllib.request.Request(url, data=payload_bytes, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                resp_bytes = resp.read()
                if not resp_bytes:
                    return {}
                try:
                    return json.loads(resp_bytes.decode("utf-8"))
                except json.JSONDecodeError:
                    return {"raw": resp_bytes.decode("utf-8")}
        except urllib.error.HTTPError as err:
            err_body = err.read().decode("utf-8", errors="ignore")
            err_json = {}
            try:
                err_json = json.loads(err_body)
            except Exception:
                pass
            msg = err_json.get("message") or err_json.get("error") or err.reason
            raise AgentShareError(str(msg), status_code=err.code, details=err_json) from err
        except urllib.error.URLError as err:
            raise AgentShareError(f"Connection failed: {err.reason}") from err

    def mint_pathway_token(
        self,
        payload: Dict[str, Any],
        framework: str = "custom",
        ttl_seconds: int = 86400,
        filename: Optional[str] = None,
        scope: str = "read",
    ) -> str:
        """
        Mint an Agntshare Pathway Token for a structured state payload.
        
        Calculates payload SHA-256 hash digest and cryptographic signature locally,
        formats metadata matching pathway_token_v1 schema.
        In mode="local", persists payload to local sandbox directory (/tmp/.agntshare/).
        In mode="cloud", uploads directly to presigned storage URLs.
        """
        if ttl_seconds < 1:
            raise ValueError("ttl_seconds must be strictly greater than 0")

        state_filename = filename or f"state-{framework}-{hashlib.md5(str(payload).encode()).hexdigest()[:8]}.json"
        
        # 1. Serialize payload to deterministic JSON bytes
        json_bytes = json.dumps(payload, indent=2, sort_keys=True).encode("utf-8")

        # 2. Calculate local SHA-256 payload checksum (Law 2: Token is Truth)
        payload_checksum = hashlib.sha256(json_bytes).hexdigest()

        # 3. Generate cryptographic provenance signature using HMAC-SHA256
        cryptographic_signature = hmac.new(
            self.api_key.encode("utf-8"),
            payload_checksum.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        # 4. Standardized pathway_token_v1 metadata contract
        pathway_metadata = {
            "schema_version": "1.0.0",
            "framework": framework,
            "intent": scope if scope in ["read", "read_write"] else "read",
            "ttl_seconds": ttl_seconds,
            "cryptographic_signature": cryptographic_signature,
            "payload_checksum": payload_checksum,
        }

        # LOCAL SANDBOX MODE (Zero-Friction Offline Testing)
        if self.mode == "local":
            token_id = f"local_{payload_checksum[:8]}"
            local_file_path = os.path.join(self.local_dir, f"{token_id}.json")
            
            token_record = {
                "token": token_id,
                "shareUrl": f"agnt.sr/{token_id}",
                "filename": state_filename,
                "metadata": pathway_metadata,
                "payload": payload,
                "createdAt": time.time(),
                "expiresAt": time.time() + ttl_seconds,
            }

            os.makedirs(self.local_dir, exist_ok=True)
            with open(local_file_path, "w", encoding="utf-8") as f:
                json.dump(token_record, f, indent=2)

            return token_id

        # CLOUD MODE (Standard Production REST + S3 Presigned URLs)
        upload_init = self._request(
            "/upload",
            method="POST",
            data={
                "filename": state_filename,
                "contentType": "application/json",
                "sizeBytes": len(json_bytes),
                "checksumSha256": payload_checksum,
            },
        )

        upload_url = upload_init.get("uploadUrl")
        asset_id = upload_init.get("assetId")

        if not upload_url or not asset_id:
            raise AgentShareError("Failed to obtain upload URL from Agntshare API")

        put_req = urllib.request.Request(
            upload_url,
            data=json_bytes,
            headers={"Content-Type": "application/json"},
            method="PUT",
        )
        try:
            with urllib.request.urlopen(put_req, timeout=30) as put_resp:
                if put_resp.status not in (200, 201, 204):
                    raise AgentShareError(f"Storage upload failed with status {put_resp.status}")
        except urllib.error.HTTPError as err:
            raise AgentShareError(f"Storage upload failed: {err.reason}", status_code=err.code) from err

        mint_res = self._request(
            "/token",
            method="POST",
            data={
                "assetId": asset_id,
                "scope": pathway_metadata["intent"],
                "ttlSeconds": pathway_metadata["ttl_seconds"],
            },
        )

        token = mint_res.get("token")
        if not token:
            raise AgentShareError("Failed to mint pathway token")

        return str(token)

    def resolve_pathway_token(
        self,
        token_id: str,
        keys: Optional[List[str]] = None,
        path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Resolve an Agntshare Pathway Token.
        
        Supports selective retrieval via `keys` (list of top-level JSON keys)
        or `path` (dot-notation JSON sub-tree path).
        """
        clean_token = token_id.replace("agnt.sr/", "").strip()

        # LOCAL SANDBOX MODE
        if self.mode == "local" or clean_token.startswith("local_"):
            local_file_path = os.path.join(self.local_dir, f"{clean_token}.json")
            if not os.path.exists(local_file_path):
                raise AgentShareError(f"Local token '{clean_token}' not found in sandbox directory ({self.local_dir})", status_code=404)

            with open(local_file_path, "r", encoding="utf-8") as f:
                token_record = json.load(f)

            if time.time() > token_record.get("expiresAt", float("inf")):
                raise AgentShareError(f"Local token '{clean_token}' has expired", status_code=410)

            state_payload = token_record.get("payload", {})

            # Filter by top-level keys
            if keys:
                state_payload = {k: v for k, v in state_payload.items() if k in keys}
            
            # Filter by dot-notation path
            elif path:
                parts = path.split(".")
                curr = state_payload
                for p in parts:
                    if isinstance(curr, dict) and p in curr:
                        curr = curr[p]
                    else:
                        curr = None
                        break
                state_payload = curr

            return {
                "filename": token_record.get("filename"),
                "contentType": "application/json",
                "checksumValid": True,
                "metadata": token_record.get("metadata"),
                "state": state_payload,
            }

        # CLOUD MODE
        query_params = {}
        if keys:
            query_params["keys"] = ",".join(keys)
        if path:
            query_params["path"] = path

        query_str = f"?{urllib.parse.urlencode(query_params)}" if query_params else ""
        resolve_res = self._request(f"/resolve/{clean_token}{query_str}", method="GET")

        if "state" in resolve_res:
            return resolve_res

        stream_url = resolve_res.get("streamUrl")
        if stream_url:
            stream_req = urllib.request.Request(stream_url, method="GET")
            try:
                with urllib.request.urlopen(stream_req, timeout=30) as stream_resp:
                    data_bytes = stream_resp.read()
                    try:
                        parsed_json = json.loads(data_bytes.decode("utf-8"))
                        return {
                            "filename": resolve_res.get("filename"),
                            "contentType": resolve_res.get("contentType"),
                            "checksumValid": resolve_res.get("checksumValid", True),
                            "state": parsed_json,
                        }
                    except json.JSONDecodeError:
                        return {
                            "filename": resolve_res.get("filename"),
                            "contentType": resolve_res.get("contentType"),
                            "checksumValid": resolve_res.get("checksumValid", True),
                            "content": data_bytes.decode("utf-8", errors="ignore"),
                        }
            except urllib.error.HTTPError as err:
                raise AgentShareError(f"Failed to stream resolved payload: {err.reason}", status_code=err.code) from err

        return resolve_res

    def revoke_token(self, token_id: str) -> bool:
        """
        Revoke an active pathway token immediately.
        Returns True if successfully revoked.
        """
        clean_token = token_id.replace("agnt.sr/", "").strip()
        if self.mode == "local" or clean_token.startswith("local_"):
            local_file_path = os.path.join(self.local_dir, f"{clean_token}.json")
            if os.path.exists(local_file_path):
                os.remove(local_file_path)
                return True
            return False

        try:
            res = self._request(f"/token/{clean_token}", method="DELETE")
            return bool(res.get("revokedAt") or res.get("success", True))
        except AgentShareError:
            return False
