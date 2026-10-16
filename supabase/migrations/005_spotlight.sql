-- 005: Spotlight / "Newest Release" feature
-- The admin manually picks which game is featured as the site's spotlight
-- (shown big on the homepage hero and at the top of the games page).

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS spotlight_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS games_spotlight_idx
  ON games (spotlight_at DESC)
  WHERE spotlight_at IS NOT NULL;
