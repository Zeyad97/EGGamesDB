BEGIN;

-- Migration 007's PL/pgSQL variable `n` conflicts with the security limit table column.
-- Keep the original caps while using a distinct variable name so inserts execute on PostgreSQL 16.
CREATE OR REPLACE FUNCTION public.enforce_user_insert_rate() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  uid uuid := auth.uid();
  bucket_name text := TG_TABLE_NAME;
  current_minute timestamptz := date_trunc('minute', now());
  cap integer := 5;
  event_count integer;
BEGIN
  IF public.security_is_service_role() THEN RETURN NEW; END IF;
  IF uid IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  IF bucket_name IN ('reports', 'contact_messages') THEN cap := 3; END IF;
  INSERT INTO public.security_insert_limits(user_id, bucket, minute, n)
  VALUES(uid, bucket_name, current_minute, 1)
  ON CONFLICT(user_id, bucket, minute)
  DO UPDATE SET n = security_insert_limits.n + 1
  RETURNING security_insert_limits.n INTO event_count;
  IF event_count > cap THEN RAISE EXCEPTION 'rate limit exceeded'; END IF;
  RETURN NEW;
END $$;

-- The review aggregate trigger must update protected game counters from a regular
-- authenticated review request. Scope the internal service-role bypass to its own update.
CREATE OR REPLACE FUNCTION public.update_game_rating() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  previous_role text := current_setting('request.jwt.claim.role', true);
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.games
  SET average_rating = (SELECT AVG(rating)::numeric(3,2) FROM public.game_reviews WHERE game_id = COALESCE(NEW.game_id, OLD.game_id)),
      rating_count = (SELECT COUNT(*) FROM public.game_reviews WHERE game_id = COALESCE(NEW.game_id, OLD.game_id))
  WHERE id = COALESCE(NEW.game_id, OLD.game_id);
  PERFORM set_config('request.jwt.claim.role', COALESCE(previous_role, ''), true);
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('request.jwt.claim.role', COALESCE(previous_role, ''), true);
  RAISE;
END $$;

-- One open report per reporter and target. Resolved reports remain in history.
CREATE UNIQUE INDEX IF NOT EXISTS reports_one_open_per_reporter_target_idx
  ON public.reports (reporter_id, target_type, target_id)
  WHERE status = 'open';

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS resolution_note text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.reports'::regclass
      AND conname = 'reports_resolution_note_length'
  ) THEN
    ALTER TABLE public.reports ADD CONSTRAINT reports_resolution_note_length
      CHECK (resolution_note IS NULL OR length(resolution_note) <= 500);
  END IF;
END $$;

DROP POLICY IF EXISTS reports_reporter_read_own ON public.reports;
CREATE POLICY reports_reporter_read_own ON public.reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid());

-- Keep admin read/update policies from migration 002. No reporter UPDATE policy is added.

UPDATE public.game_reviews SET content = NULL WHERE content IS NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.game_reviews'::regclass
      AND conname = 'game_reviews_content_null'
  ) THEN
    ALTER TABLE public.game_reviews ADD CONSTRAINT game_reviews_content_null
      CHECK (content IS NULL) NOT VALID;
  END IF;
END $$;
ALTER TABLE public.game_reviews VALIDATE CONSTRAINT game_reviews_content_null;

CREATE OR REPLACE FUNCTION public.normalize_star_review() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  NEW.is_recommended := (NEW.rating >= 6);
  NEW.content := NULL;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS game_reviews_normalize_star_review ON public.game_reviews;
CREATE TRIGGER game_reviews_normalize_star_review
  BEFORE INSERT OR UPDATE ON public.game_reviews
  FOR EACH ROW EXECUTE FUNCTION public.normalize_star_review();

COMMIT;
