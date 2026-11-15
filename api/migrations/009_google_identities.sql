-- Google links augment the existing accounts and password hashes; they never replace them.
CREATE TABLE IF NOT EXISTS google_identities (
 id TEXT PRIMARY KEY,
 issuer TEXT NOT NULL CHECK (issuer='https://accounts.google.com'),
 sub VARCHAR(255) NOT NULL CHECK (char_length(sub)>0),
 user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(issuer,sub)
);
