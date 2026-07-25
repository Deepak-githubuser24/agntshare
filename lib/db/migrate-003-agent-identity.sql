-- Migration 003: Add agent identity fields to audit_logs and pathway_tokens

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS agent_id TEXT,
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS agent_role TEXT;

ALTER TABLE pathway_tokens
  ADD COLUMN IF NOT EXISTS agent_id TEXT,
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS agent_role TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_agent_id ON audit_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);

-- Ensure permissions for least-privilege role
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs, pathway_tokens TO agentshare_app;
