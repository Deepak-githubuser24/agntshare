"""
AgentShare LangChain Middleware Hook.
Allows zero-friction, 1-line state preservation and pathway token minting for LangChain agents and LCEL chains.
"""

import sys
from typing import Any, Dict, Optional, Union

try:
    from langchain_core.callbacks import BaseCallbackHandler
except ImportError:
    # Graceful fallback base class if langchain_core is not installed
    class BaseCallbackHandler:  # type: ignore
        pass


from ..client import AgentShareClient


class AgentShareCallbackHandler(BaseCallbackHandler):
    """
    Observer-only LangChain callback handler for Agntshare.
    
    Intercepts agent finishes and LCEL chain completions to mint
    verifiable Agntshare Pathway Tokens automatically without altering agent logic.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        ttl_seconds: int = 86400,
        base_url: Optional[str] = None,
        client: Optional[AgentShareClient] = None,
    ):
        super().__init__()
        self.ttl_seconds = ttl_seconds
        self.client = client or AgentShareClient(
            api_key=api_key,
            base_url=base_url,
            agent_role="langchain-callback",
        )
        self.last_token: Optional[str] = None

    def _preserve_state(self, state_data: Any, event_name: str) -> Optional[str]:
        """Defensive internal helper to mint pathway tokens without throwing."""
        if not state_data:
            return None

        try:
            # Ensure state_data is a dictionary
            if isinstance(state_data, dict):
                payload = state_data
            else:
                payload = {"output": str(state_data)}

            token = self.client.mint_pathway_token(
                payload=payload,
                framework="langchain",
                ttl_seconds=self.ttl_seconds,
                scope="read",
            )
            self.last_token = token
            print(f"\n[Agntshare] State preserved securely. Pathway Token: agnt.sr/{token}", file=sys.stdout)
            return token
        except Exception as e:
            # Observer-only policy: swallow exception so user chain is never disrupted
            print(f"\n[Agntshare Warning] Failed to preserve state in callback ({event_name}): {e}", file=sys.stderr)
            return None

    def on_agent_finish(
        self,
        finish: Any,
        *,
        run_id: Any = None,
        parent_run_id: Any = None,
        **kwargs: Any,
    ) -> None:
        """
        Intercept agent finish event and extract return values.
        """
        return_values = getattr(finish, "return_values", None)
        if return_values is None and isinstance(finish, dict):
            return_values = finish
        
        self._preserve_state(return_values or finish, event_name="on_agent_finish")

    def on_chain_end(
        self,
        outputs: Union[Dict[str, Any], Any],
        *,
        run_id: Any = None,
        parent_run_id: Any = None,
        **kwargs: Any,
    ) -> None:
        """
        Intercept LCEL chain completion event and extract output dictionary.
        """
        # Only capture top-level chain completions (when parent_run_id is None)
        if parent_run_id is not None:
            return

        self._preserve_state(outputs, event_name="on_chain_end")
