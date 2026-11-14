CREATE TABLE IF NOT EXISTS security_tokens (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 purpose TEXT NOT NULL CHECK (purpose IN ('reset_password','confirm_email')),
 email_target VARCHAR(254),
 expires_at TIMESTAMPTZ NOT NULL,
 used_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK ((purpose='reset_password' AND email_target IS NULL) OR (purpose='confirm_email' AND email_target IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS security_tokens_active_purpose_idx ON security_tokens(user_id,purpose) WHERE used_at IS NULL;
CREATE TABLE IF NOT EXISTS account_recovery_codes (
 code_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 used_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS account_recovery_codes_user_idx ON account_recovery_codes(user_id);
CREATE TABLE IF NOT EXISTS security_rate_limits (
 key_hash TEXT PRIMARY KEY,
 window_started TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 attempts INTEGER NOT NULL CHECK (attempts > 0)
);
