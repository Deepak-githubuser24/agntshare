"""
Agntshare Universal MCP (Model Context Protocol) Server.
Provides native stdio FastMCP tool integration for Claude Desktop, Cursor, and any MCP client.
"""

import json
import os
import sys
from typing import Any, Dict, List, Optional

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    # Graceful fallback mock if mcp package is not installed in current env
    class FastMCP:  # type: ignore
        def __init__(self, name: str):
            self.name = name

        def tool(self):
            def decorator(func):
                return func
            return decorator

        def run(self):
            print(f"[Agntshare MCP] Server {self.name} initialized (mcp package required for stdio execution).")


from ..client import AgentShareClient, AgentShareError

# Initialize AgentShare Client (Defaulting to local sandbox mode for safety)
client_mode = os.environ.get("AGENTSHARE_MODE", "local")
client = AgentShareClient(mode=client_mode)

# Initialize FastMCP Server
mcp = FastMCP("Agntshare")


@mcp.tool()
def mint_pathway_token(
    payload_json: str,
    framework: str = "mcp",
    ttl_seconds: int = 86400,
) -> str:
    """
    Mint an Agntshare Pathway Token for a structured JSON state payload.
    
    Args:
        payload_json: Stringified JSON object representing agent memory/state payload.
        framework: Originating agent framework name (default: 'mcp').
        ttl_seconds: Time-to-Live expiration window in seconds (default: 86400).
        
    Returns:
        Formatted success string containing the minted pathway token (e.g. 'agnt.sr/local_8f2a1b9c').
    """
    try:
        try:
            payload_data = json.loads(payload_json)
        except json.JSONDecodeError as err:
            return f"[Agntshare Error] Invalid JSON payload string: {err}"

        if not isinstance(payload_data, dict):
            payload_data = {"payload": payload_data}

        token = client.mint_pathway_token(
            payload=payload_data,
            framework=framework,
            ttl_seconds=ttl_seconds,
            scope="read",
        )
        return f"State preserved securely. Pathway Token: agnt.sr/{token}"

    except AgentShareError as err:
        return f"[Agntshare Error] Failed to mint pathway token: {err.message}"
    except Exception as err:
        return f"[Agntshare Error] Unexpected error minting token: {err}"


@mcp.tool()
def resolve_pathway_token(
    token_id: str,
    keys: Optional[List[str]] = None,
) -> str:
    """
    Resolve an Agntshare Pathway Token to retrieve the underlying state payload.
    
    Args:
        token_id: The pathway token string (e.g. 'agnt.sr/local_8f2a1b9c' or 'local_8f2a1b9c').
        keys: Optional list of top-level JSON keys for selective context resolution.
        
    Returns:
        Stringified JSON payload retrieved from the pathway token.
    """
    try:
        res = client.resolve_pathway_token(token_id=token_id, keys=keys)
        state_payload = res.get("state", res)
        return json.dumps(state_payload, indent=2)

    except AgentShareError as err:
        return f"[Agntshare Error] Failed to resolve pathway token '{token_id}': {err.message}"
    except Exception as err:
        return f"[Agntshare Error] Unexpected error resolving token '{token_id}': {err}"


def main():
    """Main entrypoint to start the FastMCP stdio server."""
    mcp.run()


if __name__ == "__main__":
    main()
