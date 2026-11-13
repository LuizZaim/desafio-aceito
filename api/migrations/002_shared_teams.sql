-- Shared network entities; workspaces retain device preferences only.
CREATE TABLE IF NOT EXISTS teams (
 id TEXT PRIMARY KEY,
 organizer_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 name VARCHAR(80) NOT NULL CHECK (char_length(trim(name)) BETWEEN 3 AND 80),
 district VARCHAR(80) NOT NULL CHECK (char_length(trim(district)) BETWEEN 2 AND 80),
 city VARCHAR(80) NOT NULL CHECK (char_length(trim(city)) BETWEEN 2 AND 80),
 state CHAR(2) NOT NULL CHECK (state IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
 category TEXT NOT NULL CHECK (category IN ('Masculino','Feminino','Sub-15','Veteranos')),
 level TEXT NOT NULL CHECK (level IN ('Amador','Várzea','Base','Semiprofissional')),
 bio VARCHAR(500) NOT NULL DEFAULT '',
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS team_interests (
 from_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 to_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (from_team_id,to_team_id),
 CHECK (from_team_id <> to_team_id)
);
CREATE TABLE IF NOT EXISTS team_matches (
 id TEXT PRIMARY KEY,
 team_a_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 team_b_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(team_a_id,team_b_id),
 CHECK (team_a_id < team_b_id)
);
CREATE TABLE IF NOT EXISTS messages (
 id TEXT PRIMARY KEY,
 match_id TEXT NOT NULL REFERENCES team_matches(id) ON DELETE CASCADE,
 sender_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 text VARCHAR(1000) NOT NULL CHECK (char_length(trim(text)) BETWEEN 1 AND 1000),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS messages_match_time_idx ON messages(match_id,created_at,id);
CREATE TABLE IF NOT EXISTS notifications (
 id TEXT PRIMARY KEY,
 team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 text VARCHAR(500) NOT NULL,
 read BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS notifications_team_time_idx ON notifications(team_id,created_at);
CREATE TABLE IF NOT EXISTS team_reports (
 id TEXT PRIMARY KEY,
 reporter_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 reported_team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
 reason VARCHAR(500) NOT NULL CHECK (char_length(trim(reason)) BETWEEN 10 AND 500),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK (reporter_team_id <> reported_team_id)
);
-- Preserve valid existing team registrations, without importing fictional matches/messages.
INSERT INTO teams(id,organizer_id,name,district,city,state,category,level,bio,active)
SELECT 'team-' || user_id,user_id,data->'profile'->>'name',data->'profile'->>'district',
 data->'profile'->>'city',data->'profile'->>'state',data->'profile'->>'category',
 data->'profile'->>'level',left(coalesce(data->'profile'->>'bio',''),500),
 coalesce((data->>'deleted')::boolean,FALSE)=FALSE
FROM workspaces
WHERE data->>'teamRegistered' = 'true'
 AND char_length(trim(data->'profile'->>'name')) BETWEEN 3 AND 80
 AND char_length(trim(data->'profile'->>'district')) BETWEEN 2 AND 80
 AND char_length(trim(data->'profile'->>'city')) BETWEEN 2 AND 80
 AND data->'profile'->>'state' IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')
 AND data->'profile'->>'category' IN ('Masculino','Feminino','Sub-15','Veteranos')
 AND data->'profile'->>'level' IN ('Amador','Várzea','Base','Semiprofissional')
ON CONFLICT (organizer_id) DO NOTHING;
