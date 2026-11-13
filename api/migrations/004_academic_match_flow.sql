-- Academic demonstration only: no card, gateway, transfer or real financial records.
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;
ALTER TABLE games ADD CONSTRAINT games_status_check CHECK (status IN (
 'Aguardando adversário','Aguardando caução','Confirmada','Concluída','Clima: aguardando acordo','Cancelada'
));
ALTER TABLE games ADD COLUMN IF NOT EXISTS score_a INTEGER CHECK (score_a BETWEEN 0 AND 99);
ALTER TABLE games ADD COLUMN IF NOT EXISTS score_b INTEGER CHECK (score_b BETWEEN 0 AND 99);
ALTER TABLE games ADD COLUMN IF NOT EXISTS completed_by TEXT REFERENCES teams(id);
CREATE TABLE IF NOT EXISTS simulated_deposits (
 game_id TEXT PRIMARY KEY REFERENCES games(id),
 payer_team_id TEXT NOT NULL REFERENCES teams(id),
 amount_cents INTEGER NOT NULL DEFAULT 5000 CHECK (amount_cents = 5000),
 paid BOOLEAN NOT NULL DEFAULT TRUE,
 reversed BOOLEAN NOT NULL DEFAULT FALSE,
 penalty_cents INTEGER NOT NULL DEFAULT 0 CHECK (penalty_cents >= 0 AND penalty_cents <= amount_cents),
 simulated BOOLEAN NOT NULL DEFAULT TRUE CHECK (simulated = TRUE),
 paid_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 reversed_at TIMESTAMPTZ,
 CHECK (reversed = FALSE OR paid = TRUE)
);
CREATE TABLE IF NOT EXISTS game_reviews (
 game_id TEXT NOT NULL REFERENCES games(id),
 reviewer_team_id TEXT NOT NULL REFERENCES teams(id),
 target_team_id TEXT NOT NULL REFERENCES teams(id),
 skill INTEGER NOT NULL CHECK (skill BETWEEN 1 AND 5),
 fair INTEGER NOT NULL CHECK (fair BETWEEN 1 AND 5),
 punctuality INTEGER NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
 organization INTEGER NOT NULL CHECK (organization BETWEEN 1 AND 5),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(game_id,reviewer_team_id),
 CHECK (reviewer_team_id <> target_team_id)
);
CREATE INDEX IF NOT EXISTS game_reviews_target_idx ON game_reviews(target_team_id);
