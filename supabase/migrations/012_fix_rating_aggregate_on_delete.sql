BEGIN;

-- Deleting the last rating of a game made AVG() return NULL, which violates
-- games.average_rating NOT NULL and blocked the delete (including deleting a user
-- who was the only rater). Use 0 when a game has no ratings left.
-- Everything else is identical to the version from migration 010.
CREATE OR REPLACE FUNCTION public.update_game_rating() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  previous_role text := current_setting('request.jwt.claim.role', true);
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.games
  SET average_rating = COALESCE((SELECT AVG(rating) FROM public.game_reviews WHERE game_id = COALESCE(NEW.game_id, OLD.game_id)), 0)::numeric(3,2),
      rating_count = (SELECT COUNT(*) FROM public.game_reviews WHERE game_id = COALESCE(NEW.game_id, OLD.game_id))
  WHERE id = COALESCE(NEW.game_id, OLD.game_id);
  PERFORM set_config('request.jwt.claim.role', COALESCE(previous_role, ''), true);
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('request.jwt.claim.role', COALESCE(previous_role, ''), true);
  RAISE;
END $$;

COMMIT;
