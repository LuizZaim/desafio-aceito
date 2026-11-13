CREATE TABLE IF NOT EXISTS referees (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 name VARCHAR(100) NOT NULL CHECK (char_length(trim(name)) BETWEEN 3 AND 100),
 city VARCHAR(80) NOT NULL CHECK (char_length(trim(city)) BETWEEN 2 AND 80),
 state CHAR(2) NOT NULL CHECK (state IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
 kind TEXT NOT NULL CHECK (kind IN ('arbitro','bandeirinha')),
 bio VARCHAR(500) NOT NULL DEFAULT '',
 available BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS game_referees (
 id TEXT PRIMARY KEY,
 game_id TEXT NOT NULL REFERENCES games(id),
 referee_id TEXT NOT NULL REFERENCES referees(id),
 invited_by_team_id TEXT NOT NULL REFERENCES teams(id),
 role TEXT NOT NULL CHECK (role IN ('arbitro','bandeirinha1','bandeirinha2')),
 status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','Aceito','Recusado','Cancelado')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 responded_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS game_referees_active_slot_idx ON game_referees(game_id,role) WHERE status IN ('Pendente','Aceito');
CREATE UNIQUE INDEX IF NOT EXISTS game_referees_active_professional_idx ON game_referees(game_id,referee_id) WHERE status IN ('Pendente','Aceito');
CREATE INDEX IF NOT EXISTS game_referees_professional_idx ON game_referees(referee_id,status);
