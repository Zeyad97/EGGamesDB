-- Account types + wishlist checks for migration 009.
-- Run ONLY on a disposable database that has migrations 001-009 applied and
-- minimal auth/storage stubs (auth.uid(), auth.role(), auth.users, storage.*).
-- Never run against production. The whole script runs in one transaction and
-- rolls back, so it leaves no rows behind. Each check prints PASS or raises.
--
-- Usage: psql "$DISPOSABLE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/account_types_check.sql

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.check_eq(actual text, expected text, label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL %: expected %, got %', label, expected, actual;
  END IF;
  RAISE NOTICE 'PASS %', label;
END $$;

-- Passes only if the statement raises an error.
CREATE OR REPLACE FUNCTION pg_temp.check_rejects(stmt text, label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE stmt;
  RAISE EXCEPTION 'FAIL %: statement was allowed', label;
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE 'FAIL %' THEN RAISE; END IF;
  RAISE NOTICE 'PASS % (rejected: %)', label, SQLERRM;
END $$;

-- Passes only if the statement succeeds.
CREATE OR REPLACE FUNCTION pg_temp.check_allows(stmt text, label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE stmt;
  RAISE NOTICE 'PASS % (allowed)', label;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'FAIL %: %', label, SQLERRM;
END $$;

-- Fixture helpers run as the owner role, so they set the service role claim to pass
-- the game and profile guards (the same path the server-side service key uses).
SET LOCAL request.jwt.claim.role = 'service_role';

-- ------------------------------------------------------------
-- A. Sign-up trigger (handle_new_user), via auth.users inserts
-- ------------------------------------------------------------
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-00000000000a', 'studio.one@example.com',
   '{"username":"studio1","display_name":"Studio One","account_type":"studio"}'),
  ('00000000-0000-4000-8000-00000000000b', 'player.one@example.com',
   '{"username":"player1","display_name":"Player One","account_type":"player"}'),
  ('00000000-0000-4000-8000-00000000000c', 'junk.one@example.com',
   '{"display_name":"Junk One","account_type":"superuser","role":"super_admin"}'),
  ('00000000-0000-4000-8000-00000000000d', 'nometa.one@example.com', '{}');

SELECT pg_temp.check_eq((SELECT account_type FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000a'), 'studio', 'signup studio -> account_type studio');
SELECT pg_temp.check_eq((SELECT developer_status FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000a'), 'pending', 'signup studio -> developer_status pending');
SELECT pg_temp.check_eq((SELECT account_type FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000b'), 'player', 'signup player -> account_type player');
SELECT pg_temp.check_eq((SELECT developer_status FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000b'), 'none', 'signup player -> developer_status none');
SELECT pg_temp.check_eq((SELECT account_type FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000c'), 'player', 'signup junk account_type -> player');
SELECT pg_temp.check_eq((SELECT role::text FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000c'), 'user', 'signup metadata role=super_admin ignored');
SELECT pg_temp.check_eq((SELECT account_type FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000d'), 'player', 'signup without metadata -> player');
SELECT pg_temp.check_eq((SELECT role::text FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000a'), 'user', 'signup studio does not grant role');

-- ------------------------------------------------------------
-- Fixtures: two approved games, one pending game, one rejected game (service role)
-- ------------------------------------------------------------
INSERT INTO public.games (id, slug, title, short_description, long_description, developer_id, developer_name, status) VALUES
  ('10000000-0000-4000-8000-000000000001', 'test-approved-a', 'Approved A', 'Short test description', 'Long test description', '00000000-0000-4000-8000-00000000000a', 'Studio One', 'approved'),
  ('10000000-0000-4000-8000-000000000002', 'test-approved-b', 'Approved B', 'Short test description', 'Long test description', '00000000-0000-4000-8000-00000000000a', 'Studio One', 'approved'),
  ('10000000-0000-4000-8000-000000000003', 'test-pending', 'Pending', 'Short test description', 'Long test description', '00000000-0000-4000-8000-00000000000a', 'Studio One', 'pending'),
  ('10000000-0000-4000-8000-000000000004', 'test-rejected', 'Rejected', 'Short test description', 'Long test description', '00000000-0000-4000-8000-00000000000a', 'Studio One', 'rejected');

-- ------------------------------------------------------------
-- B. Self account_type switch and role protection (authenticated player B)
-- ------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
SET LOCAL request.jwt.claim.role = 'authenticated';

SELECT pg_temp.check_allows($q$UPDATE public.profiles SET account_type='studio' WHERE id='00000000-0000-4000-8000-00000000000b'$q$, 'self switch player -> studio allowed');
RESET ROLE;
SELECT pg_temp.check_eq((SELECT developer_status FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000b'), 'pending', 'self switch to studio sets developer_status pending');
SELECT pg_temp.check_eq((SELECT role::text FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000b'), 'user', 'self switch to studio keeps role user');

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
SET LOCAL request.jwt.claim.role = 'authenticated';
SELECT pg_temp.check_rejects($q$UPDATE public.profiles SET role='admin' WHERE id='00000000-0000-4000-8000-00000000000b'$q$, 'user cannot set own role to admin');
SELECT pg_temp.check_rejects($q$UPDATE public.profiles SET role='admin', account_type='studio' WHERE id='00000000-0000-4000-8000-00000000000b'$q$, 'user cannot set role while switching account_type');
SELECT pg_temp.check_rejects($q$UPDATE public.profiles SET developer_status='approved' WHERE id='00000000-0000-4000-8000-00000000000b'$q$, 'user cannot self-approve developer_status');
SELECT pg_temp.check_allows($q$UPDATE public.profiles SET account_type='player' WHERE id='00000000-0000-4000-8000-00000000000b'$q$, 'self switch studio -> player allowed');
SELECT pg_temp.check_allows($q$UPDATE public.profiles SET display_name='Player One Renamed' WHERE id='00000000-0000-4000-8000-00000000000b'$q$, 'self display_name update allowed');
RESET ROLE;
SELECT pg_temp.check_eq((SELECT developer_status FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000b'), 'pending', 'switching back to player keeps developer_status');
SELECT pg_temp.check_eq((SELECT role::text FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000b'), 'user', 'role unchanged after account_type switches');

-- Rejected studio applicant switching to studio again re-applies (rejected -> pending).
SET LOCAL request.jwt.claim.role = 'service_role';
UPDATE public.profiles SET developer_status='rejected' WHERE id='00000000-0000-4000-8000-00000000000c';
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
SET LOCAL request.jwt.claim.role = 'authenticated';
SELECT pg_temp.check_allows($q$UPDATE public.profiles SET account_type='studio' WHERE id='00000000-0000-4000-8000-00000000000c'$q$, 'rejected user may re-apply by switching to studio');
RESET ROLE;
SELECT pg_temp.check_eq((SELECT developer_status FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000c'), 'pending', 'rejected -> studio switch sets pending');

-- Another user's account_type cannot be changed (RLS hides the row; value stays).
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
SET LOCAL request.jwt.claim.role = 'authenticated';
UPDATE public.profiles SET account_type='studio' WHERE id='00000000-0000-4000-8000-00000000000d';
RESET ROLE;
SELECT pg_temp.check_eq((SELECT account_type FROM public.profiles WHERE id='00000000-0000-4000-8000-00000000000d'), 'player', 'cannot change another user account_type');

-- ------------------------------------------------------------
-- C. Wishlists RLS and wishlist_count
-- ------------------------------------------------------------
-- Fixture rows as service role: B wishlists approved A; C wishlists approved A.
INSERT INTO public.wishlists (user_id, game_id) VALUES
  ('00000000-0000-4000-8000-00000000000b', '10000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-00000000000c', '10000000-0000-4000-8000-000000000001');

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
SET LOCAL request.jwt.claim.role = 'authenticated';

SELECT pg_temp.check_eq((SELECT count(*)::text FROM public.wishlists), '1', 'RLS select shows only own wishlist rows');
SELECT pg_temp.check_allows($q$INSERT INTO public.wishlists (user_id, game_id) VALUES ('00000000-0000-4000-8000-00000000000b','10000000-0000-4000-8000-000000000002')$q$, 'add approved game to own wishlist');
SELECT pg_temp.check_rejects($q$INSERT INTO public.wishlists (user_id, game_id) VALUES ('00000000-0000-4000-8000-00000000000b','10000000-0000-4000-8000-000000000003')$q$, 'cannot wishlist a pending game');
SELECT pg_temp.check_rejects($q$INSERT INTO public.wishlists (user_id, game_id) VALUES ('00000000-0000-4000-8000-00000000000b','10000000-0000-4000-8000-000000000004')$q$, 'cannot wishlist a rejected game');
SELECT pg_temp.check_rejects($q$INSERT INTO public.wishlists (user_id, game_id) VALUES ('00000000-0000-4000-8000-00000000000c','10000000-0000-4000-8000-000000000002')$q$, 'cannot add a wishlist row for another user');
SELECT pg_temp.check_eq((SELECT count(*)::text FROM public.wishlists WHERE user_id='00000000-0000-4000-8000-00000000000c'), '0', 'RLS hides another user rows');
SELECT pg_temp.check_eq((SELECT count(*)::text FROM public.wishlists), '2', 'own wishlist rows after inserts');

DELETE FROM public.wishlists WHERE user_id='00000000-0000-4000-8000-00000000000c' AND game_id='10000000-0000-4000-8000-000000000001';
RESET ROLE;
SELECT pg_temp.check_eq((SELECT count(*)::text FROM public.wishlists WHERE user_id='00000000-0000-4000-8000-00000000000c'), '1', 'cannot delete another user wishlist row');

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
SET LOCAL request.jwt.claim.role = 'authenticated';
SELECT pg_temp.check_allows($q$DELETE FROM public.wishlists WHERE user_id='00000000-0000-4000-8000-00000000000b' AND game_id='10000000-0000-4000-8000-000000000002'$q$, 'delete own wishlist row');
SELECT pg_temp.check_rejects($q$UPDATE public.wishlists SET game_id='10000000-0000-4000-8000-000000000003' WHERE user_id='00000000-0000-4000-8000-00000000000b'$q$, 'no UPDATE policy on wishlists');
RESET ROLE;

-- wishlist_count: approved only, callable by anon.
SET LOCAL ROLE anon;
SET LOCAL request.jwt.claim.sub = '';
SET LOCAL request.jwt.claim.role = 'anon';
SELECT pg_temp.check_eq((SELECT public.wishlist_count('10000000-0000-4000-8000-000000000001')::text), '2', 'anon wishlist_count approved game');
SELECT pg_temp.check_eq((SELECT public.wishlist_count('10000000-0000-4000-8000-000000000003')::text), '0', 'wishlist_count pending game is 0');
SELECT pg_temp.check_rejects($q$INSERT INTO public.wishlists (user_id, game_id) VALUES ('00000000-0000-4000-8000-00000000000d','10000000-0000-4000-8000-000000000001')$q$, 'anon cannot write wishlists');
RESET ROLE;

-- A game that is later rejected drops out of the count.
SET LOCAL request.jwt.claim.role = 'service_role';
UPDATE public.games SET status='rejected', rejection_reason='test' WHERE id='10000000-0000-4000-8000-000000000001';
SET LOCAL ROLE anon;
SELECT pg_temp.check_eq((SELECT public.wishlist_count('10000000-0000-4000-8000-000000000001')::text), '0', 'wishlist_count drops rejected game');
RESET ROLE;

-- ------------------------------------------------------------
-- D. Routine privileges
-- ------------------------------------------------------------
SELECT pg_temp.check_eq(
  (SELECT has_function_privilege('anon', 'public.wishlist_count(uuid)', 'EXECUTE')::text), 'true', 'anon may EXECUTE wishlist_count');
SELECT pg_temp.check_eq(
  (SELECT has_function_privilege('authenticated', 'public.wishlist_count(uuid)', 'EXECUTE')::text), 'true', 'authenticated may EXECUTE wishlist_count');
SELECT pg_temp.check_eq(
  (SELECT has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE')::text), 'false', 'anon may not EXECUTE handle_new_user');

DO $$ BEGIN RAISE NOTICE 'ALL ACCOUNT TYPE / WISHLIST CHECKS PASSED'; END $$;

ROLLBACK;
