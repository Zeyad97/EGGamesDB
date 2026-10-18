-- Run after migrations 001-010 using a local PostgreSQL database with Supabase auth.uid()/auth.role() stubs.
-- All fixtures are rolled back when this check finishes.
BEGIN;

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('10000000-0000-0000-0000-000000000001', 'reporter_one@example.test', '{"display_name":"Reporter One"}'),
  ('10000000-0000-0000-0000-000000000002', 'reporter_two@example.test', '{"display_name":"Reporter Two"}'),
  ('10000000-0000-0000-0000-000000000003', 'report_admin@example.test', '{"display_name":"Report Admin"}');
ALTER TABLE public.profiles DISABLE TRIGGER profiles_security_fields;
UPDATE public.profiles SET role = 'admin' WHERE id = '10000000-0000-0000-0000-000000000003';
ALTER TABLE public.profiles ENABLE TRIGGER profiles_security_fields;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
INSERT INTO public.games (id, slug, title, short_description, long_description, developer_id, developer_name)
VALUES ('20000000-0000-0000-0000-000000000001', 'reports-check-game', 'Reports Check Game', 'A valid test description.', 'A sufficiently long test description for migration checks.', '10000000-0000-0000-0000-000000000001', 'Check Studio');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
INSERT INTO public.reports (reporter_id, target_type, target_id, reason)
VALUES ('10000000-0000-0000-0000-000000000001', 'game', '20000000-0000-0000-0000-000000000001', 'Inaccurate information');
DO $$
BEGIN
  BEGIN
    INSERT INTO public.reports (reporter_id, target_type, target_id, reason)
    VALUES ('10000000-0000-0000-0000-000000000001', 'game', '20000000-0000-0000-0000-000000000001', 'Spam or fake listing');
    RAISE EXCEPTION 'duplicate open report was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  IF (SELECT count(*) FROM public.reports) <> 1 THEN RAISE EXCEPTION 'reporter can read another user report'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
INSERT INTO public.reports (reporter_id, target_type, target_id, reason)
VALUES ('10000000-0000-0000-0000-000000000002', 'game', '20000000-0000-0000-0000-000000000001', 'Not an Egyptian game');
DO $$
BEGIN
  IF (SELECT count(*) FROM public.reports) <> 1 THEN RAISE EXCEPTION 'reporter can read another user report'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
DO $$
BEGIN
  IF (SELECT count(*) FROM public.reports) <> 2 THEN RAISE EXCEPTION 'admin cannot read all reports'; END IF;
END $$;
UPDATE public.reports
SET status = 'resolved', resolved_by = '10000000-0000-0000-0000-000000000003',
    resolved_at = now(), resolution_note = 'Reviewed and corrected.'
WHERE reporter_id = '10000000-0000-0000-0000-000000000001';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.reports WHERE reporter_id='10000000-0000-0000-0000-000000000001' AND status='resolved' AND resolved_by='10000000-0000-0000-0000-000000000003' AND resolved_at IS NOT NULL AND resolution_note='Reviewed and corrected.') THEN
    RAISE EXCEPTION 'admin resolution fields were not saved';
  END IF;
END $$;

SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
INSERT INTO public.game_reviews (game_id, user_id, rating, content, is_recommended)
VALUES ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 9, 'must be discarded', false);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.game_reviews WHERE user_id='10000000-0000-0000-0000-000000000001' AND content IS NULL AND is_recommended) THEN
    RAISE EXCEPTION 'insert did not normalize content/recommendation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.games WHERE id='20000000-0000-0000-0000-000000000001' AND average_rating=9 AND rating_count=1) THEN
    RAISE EXCEPTION 'existing rating trigger did not update game aggregates on insert';
  END IF;
  IF current_setting('request.jwt.claim.role', true) <> 'authenticated' THEN RAISE EXCEPTION 'rating trigger did not restore request role'; END IF;
END $$;
UPDATE public.game_reviews SET rating=3, content='must also be discarded', is_recommended=true
WHERE user_id='10000000-0000-0000-0000-000000000001';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.game_reviews WHERE user_id='10000000-0000-0000-0000-000000000001' AND content IS NULL AND NOT is_recommended) THEN
    RAISE EXCEPTION 'update did not normalize content/recommendation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.games WHERE id='20000000-0000-0000-0000-000000000001' AND average_rating=3 AND rating_count=1) THEN
    RAISE EXCEPTION 'existing rating trigger did not update game aggregates on update';
  END IF;
  IF current_setting('request.jwt.claim.role', true) <> 'authenticated' THEN RAISE EXCEPTION 'rating trigger did not restore request role after update'; END IF;
END $$;

RESET ROLE;
ROLLBACK;
SELECT 'reports_stars_check: PASS' AS result;
