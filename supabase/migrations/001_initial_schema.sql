-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('user', 'contributor', 'admin', 'super_admin');
CREATE TYPE game_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE report_status AS ENUM ('open', 'resolved', 'dismissed');
CREATE TYPE report_target AS ENUM ('game', 'review', 'user');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL CHECK (length(username) BETWEEN 3 AND 30 AND username ~ '^[a-zA-Z0-9_-]+$'),
  display_name  TEXT CHECK (length(display_name) <= 60),
  avatar_url    TEXT,
  bio           TEXT CHECK (length(bio) <= 500),
  role          user_role NOT NULL DEFAULT 'user',
  website       TEXT,
  twitter       TEXT,
  github        TEXT,
  steam_id      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GAMES
-- ============================================================
CREATE TABLE games (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                  TEXT UNIQUE NOT NULL,
  title                 TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  title_ar              TEXT,
  short_description     TEXT NOT NULL CHECK (length(short_description) BETWEEN 10 AND 500),
  short_description_ar  TEXT,
  long_description      TEXT NOT NULL,
  long_description_ar   TEXT,
  steam_app_id          TEXT UNIQUE,
  steam_url             TEXT,
  header_image          TEXT,
  capsule_image         TEXT,
  screenshots           JSONB NOT NULL DEFAULT '[]',
  videos                JSONB NOT NULL DEFAULT '[]',
  tags                  TEXT[] NOT NULL DEFAULT '{}',
  genres                TEXT[] NOT NULL DEFAULT '{}',
  release_date          DATE,
  developer_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  developer_name        TEXT NOT NULL,
  publisher             TEXT,
  status                game_status NOT NULL DEFAULT 'draft',
  rejection_reason      TEXT,
  reviewed_by           UUID REFERENCES profiles(id),
  reviewed_at           TIMESTAMPTZ,
  windows_requirements  JSONB,
  mac_requirements      JSONB,
  linux_requirements    JSONB,
  is_free               BOOLEAN NOT NULL DEFAULT FALSE,
  price_usd             DECIMAL(10,2),
  metacritic_score      SMALLINT CHECK (metacritic_score BETWEEN 0 AND 100),
  rating_count          INTEGER NOT NULL DEFAULT 0,
  average_rating        DECIMAL(3,2) NOT NULL DEFAULT 0,
  view_count            INTEGER NOT NULL DEFAULT 0,
  search_vector         TSVECTOR,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX games_search_idx ON games USING GIN(search_vector);
CREATE INDEX games_tags_idx ON games USING GIN(tags);
CREATE INDEX games_genres_idx ON games USING GIN(genres);
CREATE INDEX games_status_idx ON games(status);
CREATE INDEX games_developer_idx ON games(developer_id);
CREATE INDEX games_steam_app_idx ON games(steam_app_id);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION update_game_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(NEW.tags, ' ')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(NEW.genres, ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER games_search_update
  BEFORE INSERT OR UPDATE OF title, short_description, tags, genres
  ON games
  FOR EACH ROW EXECUTE FUNCTION update_game_search_vector();

-- ============================================================
-- GAME REVIEWS
-- ============================================================
CREATE TABLE game_reviews (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id          UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating           SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 10),
  content          TEXT CHECK (length(content) <= 2000),
  is_recommended   BOOLEAN NOT NULL DEFAULT TRUE,
  helpful_count    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

CREATE INDEX reviews_game_idx ON game_reviews(game_id);
CREATE INDEX reviews_user_idx ON game_reviews(user_id);

-- Auto-update game rating
CREATE OR REPLACE FUNCTION update_game_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE games
  SET
    average_rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM game_reviews WHERE game_id = COALESCE(NEW.game_id, OLD.game_id)),
    rating_count   = (SELECT COUNT(*)                  FROM game_reviews WHERE game_id = COALESCE(NEW.game_id, OLD.game_id))
  WHERE id = COALESCE(NEW.game_id, OLD.game_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_rating_update
  AFTER INSERT OR UPDATE OR DELETE ON game_reviews
  FOR EACH ROW EXECUTE FUNCTION update_game_rating();

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type  report_target NOT NULL,
  target_id    UUID NOT NULL,
  reason       TEXT NOT NULL CHECK (length(reason) BETWEEN 5 AND 200),
  details      TEXT CHECK (length(details) <= 1000),
  status       report_status NOT NULL DEFAULT 'open',
  resolved_by  UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reports_status_idx ON reports(status);
CREATE INDEX reports_reporter_idx ON reports(reporter_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        notification_type NOT NULL DEFAULT 'info',
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  action_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON notifications(user_id, read);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  metadata    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_actor_idx ON audit_logs(actor_id);
CREATE INDEX audit_created_idx ON audit_logs(created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER games_updated_at    BEFORE UPDATE ON games    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE base_username TEXT;
DECLARE final_username TEXT;
DECLARE counter INTEGER := 0;
BEGIN
  base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9_-]', '', 'g'));
  IF LENGTH(base_username) < 3 THEN base_username := 'user'; END IF;
  final_username := base_username;
  LOOP
    BEGIN
      INSERT INTO profiles (id, username, display_name, avatar_url)
      VALUES (
        NEW.id,
        final_username,
        COALESCE(NEW.raw_user_meta_data->>'display_name', final_username),
        NEW.raw_user_meta_data->>'avatar_url'
      );
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      counter := counter + 1;
      final_username := base_username || counter::TEXT;
    END;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
