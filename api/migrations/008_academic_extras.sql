-- Academic identifiers and entitlements only. No PAN, CVV, charge or real subscription.
CREATE TABLE IF NOT EXISTS academic_wallets (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 plan TEXT NOT NULL DEFAULT 'gratuito' CHECK (plan IN ('gratuito','academico')),
 priority_credits INTEGER NOT NULL DEFAULT 0 CHECK (priority_credits BETWEEN 0 AND 10),
 plan_credit_granted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS demo_cards (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 label VARCHAR(40) NOT NULL CHECK (char_length(trim(label)) BETWEEN 3 AND 40),
 last4 CHAR(4) NOT NULL CHECK (last4 ~ '^[0-9]{4}$'),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS demo_cards_user_idx ON demo_cards(user_id,created_at,id);
CREATE TABLE IF NOT EXISTS team_players (
 id TEXT PRIMARY KEY,
 team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 name VARCHAR(60) NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 60),
 number INTEGER CHECK (number BETWEEN 0 AND 99),
 position VARCHAR(30) NOT NULL CHECK (char_length(trim(position)) BETWEEN 2 AND 30),
 UNIQUE(team_id,number)
);
CREATE TABLE IF NOT EXISTS team_academic_settings (
 team_id TEXT PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
 preferred_field VARCHAR(120) NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS priority_interests (
 from_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 to_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (from_team_id,to_team_id),
 CHECK (from_team_id <> to_team_id)
);
