"""
Quickstart: Multi-Agent State Handoff via Agntshare Pathway Tokens.
Demonstrates zero-friction local state handoff between Agent A (Research Agent)
and Agent B (Writer Agent) in under 20 lines of core logic.
"""

import sys
import time

# Ensure local agentshare package is importable
sys.path.insert(0, ".")

from agentshare import AgentShareClient

# Initialize Local Sandbox client (Zero-config offline mode)
client = AgentShareClient(mode="local")

start_time = time.time()

# -------------------------------------------------------------------------
# AGENT A (Research Agent): Generates massive 5MB state (~100k tokens)
# -------------------------------------------------------------------------
print("[Agent A - Research] Generating multi-agent research payload...")
research_payload = {
    "summary": "Deep-dive analysis of multi-agent memory persistence architectures.",
    "dataset": [{"id": i, "content": f"Document snippet #{i} with semantic vector embedding simulation data."} for i in range(15000)],
    "decisions": ["Adopt Agntshare Pathway Tokens", "Enforce Law 1 Blind Pipe"],
    "metrics": {"total_documents": 15000, "confidence": 0.98},
}

# Agent A mints a short Pathway Token for the state
token = client.mint_pathway_token(payload=research_payload, framework="langchain", ttl_seconds=3600)
token_url = f"agnt.sr/{token}"

print(f"[Agent A - Research] State preserved securely. Token: {token_url}")

# -------------------------------------------------------------------------
# AGENT B (Writer Agent): Receives ONLY the short token string
# -------------------------------------------------------------------------
print(f"\n[Agent B - Writer] Received token: {token_url}")

# Agent B resolves token & selectively retrieves top-level keys
resolved_data = client.resolve_pathway_token(token, keys=["summary", "decisions", "metrics"])

end_time = time.time()

# Print results
print("\n[Agent B - Writer] Resolved State Payload:")
print(f"  * Summary:   {resolved_data['state']['summary']}")
print(f"  * Decisions: {resolved_data['state']['decisions']}")
print(f"  * Metrics:   {resolved_data['state']['metrics']}")
print(f"\n[Performance] Total End-to-End Handoff Time: {(end_time - start_time) * 1000:.2f} ms")
