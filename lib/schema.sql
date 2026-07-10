-- AgentShare core schema
-- Run: psql "$DATABASE_URL" -f lib/db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  auth_provider TEXT NOT NULL DEFAULT 'clerk',
  auth_subject  TEXT,               -- external auth provider's user id
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_key   TEXT NOT NULL,      -- S3 object key
  filename      TEXT NOT NULL,
  content_type  TEXT,
  size_bytes    BIGINT,
  checksum_sha256 TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pathway_tokens (
  token         TEXT PRIMARY KEY,
  asset_id      UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope         TEXT NOT NULL DEFAULT 'read',   -- read | read_write | admin
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  event_type    TEXT NOT NULL,      -- upload | token_created | token_resolved | token_revoked | stream_started
  token         TEXT,
  asset_id      UUID REFERENCES assets(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address    TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pathway_tokens_asset_id ON pathway_tokens(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_token ON audit_logs(token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
