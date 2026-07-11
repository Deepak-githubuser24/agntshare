-- Migration: Add new columns and tables for security hardening
-- Run after the base schema has been applied to an existing DB.

-- 1. Add password_hash column to users (if not already present)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Create api_keys table (if not already present)
CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash      TEXT NOT NULL,
  label         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);

-- 3. Create analytics_events table (if not already present)
CREATE TABLE IF NOT EXISTS analytics_events (
  id            BIGSERIAL PRIMARY KEY,
  event_type    TEXT NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  properties    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create indexes (if not already present)
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
