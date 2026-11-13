CREATE TABLE IF NOT EXISTS fields (
 id TEXT PRIMARY KEY,
 name VARCHAR(100) NOT NULL CHECK (char_length(trim(name)) BETWEEN 3 AND 100),
 normalized_key TEXT NOT NULL UNIQUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS games (
 id TEXT PRIMARY KEY,
 match_id TEXT NOT NULL REFERENCES team_matches(id),
 team_a_id TEXT NOT NULL REFERENCES teams(id),
 team_b_id TEXT NOT NULL REFERENCES teams(id),
 proposer_team_id TEXT NOT NULL REFERENCES teams(id),
 home_team_id TEXT NOT NULL REFERENCES teams(id),
 field_id TEXT NOT NULL REFERENCES fields(id),
 starts_at TIMESTAMPTZ NOT NULL,
 status TEXT NOT NULL DEFAULT 'Aguardando adversário' CHECK (status IN ('Aguardando adversário','Aguardando caução','Clima: aguardando acordo','Cancelada')),
 weather_requested_by TEXT REFERENCES teams(id),
 reason VARCHAR(250),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK (team_a_id < team_b_id),
 CHECK (proposer_team_id IN (team_a_id,team_b_id)),
 CHECK (home_team_id IN (team_a_id,team_b_id)),
 CHECK (weather_requested_by IS NULL OR weather_requested_by IN (team_a_id,team_b_id))
);
CREATE INDEX IF NOT EXISTS games_slot_idx ON games(starts_at,field_id) WHERE status <> 'Cancelada';
CREATE INDEX IF NOT EXISTS games_team_a_idx ON games(team_a_id,starts_at);
CREATE INDEX IF NOT EXISTS games_team_b_idx ON games(team_b_id,starts_at);
