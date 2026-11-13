-- Preserve existing venue text. Address and coordinates are unknown until explicitly supplied.
ALTER TABLE fields ADD COLUMN IF NOT EXISTS address VARCHAR(250);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE fields ADD CONSTRAINT fields_coordinates_check CHECK (
 (latitude IS NULL AND longitude IS NULL)
 OR (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
);
ALTER TABLE fields ADD CONSTRAINT fields_address_check CHECK (address IS NULL OR char_length(trim(address)) BETWEEN 2 AND 250);

-- The DER identifies each deposit independently from its unique game relationship.
ALTER TABLE simulated_deposits ADD COLUMN IF NOT EXISTS id TEXT;
UPDATE simulated_deposits SET id='deposit-' || game_id WHERE id IS NULL;
ALTER TABLE simulated_deposits ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE simulated_deposits ALTER COLUMN id SET NOT NULL;
ALTER TABLE simulated_deposits ADD CONSTRAINT simulated_deposits_game_unique UNIQUE(game_id);
ALTER TABLE simulated_deposits DROP CONSTRAINT simulated_deposits_pkey;
ALTER TABLE simulated_deposits ADD CONSTRAINT simulated_deposits_pkey PRIMARY KEY(id);
-- NULL for academic simulations: never manufacture an external provider transaction.
ALTER TABLE simulated_deposits ADD COLUMN IF NOT EXISTS external_transaction_id VARCHAR(200);
ALTER TABLE simulated_deposits ADD CONSTRAINT simulated_deposits_external_transaction_unique UNIQUE(external_transaction_id);

-- Keep one review per participant and game while providing a standalone entity identifier.
ALTER TABLE game_reviews ADD COLUMN IF NOT EXISTS id TEXT;
UPDATE game_reviews SET id='review-' || game_id || '-' || reviewer_team_id WHERE id IS NULL;
ALTER TABLE game_reviews ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE game_reviews ALTER COLUMN id SET NOT NULL;
ALTER TABLE game_reviews ADD CONSTRAINT game_reviews_game_reviewer_unique UNIQUE(game_id,reviewer_team_id);
ALTER TABLE game_reviews DROP CONSTRAINT game_reviews_pkey;
ALTER TABLE game_reviews ADD CONSTRAINT game_reviews_pkey PRIMARY KEY(id);
