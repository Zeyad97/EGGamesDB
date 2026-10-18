-- Sign-up IP limit checks for migration 011.
-- Run ONLY on a disposable database that has migration 011 applied and
-- minimal auth stubs (auth.users with id/email, and the Supabase roles anon,
-- authenticated, service_role, supabase_auth_admin). Never run against
-- production. The whole script runs in one transaction and rolls back, so it
-- leaves no rows behind. Each check prints PASS or raises.
--
-- Usage: psql "$DISPOSABLE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/signup_ip_limit_check.sql

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.check_eq(actual text, expected text, label text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL %: expected %, got %', label, expected, actual;
  END IF;
  RAISE NOTICE 'PASS %', label;
END $$;

-- Calls the hook the way Supabase Auth does (metadata.ip_address + user.email).
CREATE OR REPLACE FUNCTION pg_temp.hook(ip text, email text) RETURNS jsonb
LANGUAGE sql AS $$
  SELECT public.hook_before_user_created(jsonb_build_object(
    'metadata', jsonb_build_object(
      'uuid', gen_random_uuid(), 'time', now(),
      'name', 'before-user-created', 'ip_address', ip),
    'user', jsonb_build_object('email', email, 'user_metadata', '{}'::jsonb)
  ))
$$;

CREATE OR REPLACE FUNCTION pg_temp.log_count(ip text) RETURNS int
LANGUAGE sql AS $$
  SELECT count(*)::int FROM public.signup_ip_log
  WHERE ip_hash = public.signup_ip_hash(ip)
$$;

DO $$
DECLARE
  total_before int;
BEGIN
  -- Normalisation
  PERFORM pg_temp.check_eq(public.signup_ip_normalize('1.2.3.4'), '1.2.3.4', 'ipv4 kept as is');
  PERFORM pg_temp.check_eq(public.signup_ip_normalize('::ffff:1.2.3.4'), '1.2.3.4', 'ipv4-mapped ipv6 treated as ipv4');
  PERFORM pg_temp.check_eq(public.signup_ip_normalize('2001:db8:1:2:ffff::5'), '2001:db8:1:2::', 'ipv6 reduced to /64');
  PERFORM pg_temp.check_eq((public.signup_ip_normalize('garbage') IS NULL)::text, 'true', 'garbage ip normalises to NULL');
  PERFORM pg_temp.check_eq((public.signup_ip_normalize(NULL) IS NULL)::text, 'true', 'null ip normalises to NULL');

  -- Two distinct emails from one IP pass; the third is rejected
  PERFORM pg_temp.check_eq(pg_temp.hook('1.2.3.4', 'a@x.test')::text, '{}', 'first account from ip allowed');
  PERFORM pg_temp.check_eq(pg_temp.hook('1.2.3.4', 'b@x.test')::text, '{}', 'second distinct account from ip allowed');
  PERFORM pg_temp.check_eq(pg_temp.hook('1.2.3.4', 'c@x.test') #>> '{error,message}', 'signup_limit_reached', 'third distinct account rejected with message');
  PERFORM pg_temp.check_eq(pg_temp.hook('1.2.3.4', 'c@x.test') #>> '{error,http_code}', '429', 'rejection carries http_code 429');
  PERFORM pg_temp.check_eq(pg_temp.log_count('1.2.3.4')::text, '2', 'rejected sign-up did not consume a slot');

  -- Same email retrying is allowed and uses no slot (case-insensitive)
  PERFORM pg_temp.check_eq(pg_temp.hook('1.2.3.4', 'a@x.test')::text, '{}', 'retry of same email allowed');
  PERFORM pg_temp.check_eq(pg_temp.hook('1.2.3.4', 'A@X.TEST')::text, '{}', 'retry with different case allowed');
  PERFORM pg_temp.check_eq(pg_temp.log_count('1.2.3.4')::text, '2', 'retries did not add rows');

  -- A different IP is allowed
  PERFORM pg_temp.check_eq(pg_temp.hook('5.6.7.8', 'd@x.test')::text, '{}', 'different ip allowed');

  -- IPv6: same /64 counts as one network, different /64 does not
  PERFORM pg_temp.check_eq(pg_temp.hook('2001:db8:1:2::1', 'e@x.test')::text, '{}', 'ipv6 first address in /64 allowed');
  PERFORM pg_temp.check_eq(pg_temp.hook('2001:db8:1:2:ffff::5', 'f@x.test')::text, '{}', 'second ipv6 address in same /64 allowed');
  PERFORM pg_temp.check_eq(pg_temp.hook('2001:db8:1:2::9', 'g@x.test') #>> '{error,message}', 'signup_limit_reached', 'third account in same /64 rejected');
  PERFORM pg_temp.check_eq(pg_temp.hook('2001:db8:1:3::1', 'h@x.test')::text, '{}', 'ipv6 address in a different /64 allowed');

  -- Allowlisted IP is never limited and is not logged
  INSERT INTO public.signup_ip_allowlist (ip_hash, note)
  VALUES (public.signup_ip_hash('9.9.9.9'), 'test owner ip');
  PERFORM pg_temp.check_eq(pg_temp.hook('9.9.9.9', 'p1@x.test')::text, '{}', 'allowlisted ip: account 1 allowed');
  PERFORM pg_temp.check_eq(pg_temp.hook('9.9.9.9', 'p2@x.test')::text, '{}', 'allowlisted ip: account 2 allowed');
  PERFORM pg_temp.check_eq(pg_temp.hook('9.9.9.9', 'p3@x.test')::text, '{}', 'allowlisted ip: account 3 allowed');
  PERFORM pg_temp.check_eq(pg_temp.log_count('9.9.9.9')::text, '0', 'allowlisted ip is not logged');

  -- Null / garbage / missing IP and missing email are allowed, nothing logged
  SELECT count(*)::int INTO total_before FROM public.signup_ip_log;
  PERFORM pg_temp.check_eq(pg_temp.hook(NULL, 'n1@x.test')::text, '{}', 'null ip allowed');
  PERFORM pg_temp.check_eq(pg_temp.hook('garbage', 'n2@x.test')::text, '{}', 'garbage ip allowed');
  PERFORM pg_temp.check_eq(pg_temp.hook('', 'n3@x.test')::text, '{}', 'empty ip allowed');
  PERFORM pg_temp.check_eq(pg_temp.hook('1.2.3.4:5678', 'n4@x.test')::text, '{}', 'ip with port (unparseable) allowed');
  PERFORM pg_temp.check_eq(public.hook_before_user_created('{}'::jsonb)::text, '{}', 'missing metadata and email allowed');
  PERFORM pg_temp.check_eq(
    (SELECT count(*)::text FROM public.signup_ip_log), total_before::text, 'unreadable requests add no rows');

  -- Deleting a user frees a slot. Users a@x.test (1.2.3.4) and d@x.test exist.
  INSERT INTO auth.users (email) VALUES ('a@x.test'), ('d@x.test');
  PERFORM pg_temp.check_eq(pg_temp.log_count('1.2.3.4')::text, '2', 'before delete: 1.2.3.4 has 2 slots used');
  DELETE FROM auth.users WHERE email = 'a@x.test';
  PERFORM pg_temp.check_eq(pg_temp.log_count('1.2.3.4')::text, '1', 'after deleting a user, its slot is released');
  PERFORM pg_temp.check_eq(pg_temp.hook('1.2.3.4', 'z@x.test')::text, '{}', 'freed slot can be used by a new account');
  PERFORM pg_temp.check_eq(pg_temp.hook('1.2.3.4', 'y@x.test') #>> '{error,message}', 'signup_limit_reached', 'limit enforced again after reuse');
  DELETE FROM auth.users WHERE email = 'd@x.test';
  PERFORM pg_temp.check_eq(pg_temp.log_count('5.6.7.8')::text, '0', 'deleting d@x.test releases 5.6.7.8');

  -- (a) + (c) Mistyped emails that never became accounts hold a slot for one
  -- hour only. Within the hour a third distinct email is still rejected.
  PERFORM pg_temp.check_eq(pg_temp.hook('10.0.0.1', 'typo1@gmial.test')::text, '{}', 'typo attempt 1 allowed');
  PERFORM pg_temp.check_eq(pg_temp.hook('10.0.0.1', 'typo2@gmial.test')::text, '{}', 'typo attempt 2 allowed');
  PERFORM pg_temp.check_eq(pg_temp.hook('10.0.0.1', 'real1@x.test') #>> '{error,message}', 'signup_limit_reached',
    '(c) within the hour, a third distinct email is still rejected');
  UPDATE public.signup_ip_log SET created_at = now() - interval '2 hours'
  WHERE ip_hash = public.signup_ip_hash('10.0.0.1');
  PERFORM pg_temp.check_eq(pg_temp.hook('10.0.0.1', 'real2@x.test')::text, '{}',
    '(a) after one hour, unregistered typo attempts are released and a new email is allowed');
  PERFORM pg_temp.check_eq(pg_temp.log_count('10.0.0.1')::text, '1', 'stale typo rows were purged from the log');

  -- (b) A registered account keeps its slot until the account is deleted.
  PERFORM pg_temp.check_eq(pg_temp.hook('10.0.0.2', 'reg1@x.test')::text, '{}', 'reg1 allowed');
  INSERT INTO auth.users (email) VALUES ('reg1@x.test');
  UPDATE public.signup_ip_log SET created_at = now() - interval '3 days'
  WHERE email_hash = public.signup_hash_value('reg1@x.test');
  PERFORM pg_temp.check_eq(pg_temp.hook('10.0.0.2', 'reg2@x.test')::text, '{}', 'reg2 allowed (one registered slot in use)');
  PERFORM pg_temp.check_eq(pg_temp.hook('10.0.0.2', 'reg3@x.test') #>> '{error,message}', 'signup_limit_reached',
    '(b) registered account from 3 days ago still holds its slot');
  DELETE FROM auth.users WHERE email = 'reg1@x.test';
  PERFORM pg_temp.check_eq(pg_temp.hook('10.0.0.2', 'reg3@x.test')::text, '{}', 'deleting the registered account frees its slot');

  -- (d) The trigger marks a row registered when the account is created.
  PERFORM pg_temp.check_eq(pg_temp.hook('10.0.0.3', 'mark@x.test')::text, '{}', 'mark attempt allowed');
  PERFORM pg_temp.check_eq(
    (SELECT registered::text FROM public.signup_ip_log WHERE email_hash = public.signup_hash_value('mark@x.test')),
    'false', 'attempt starts unregistered');
  INSERT INTO auth.users (email) VALUES ('mark@x.test');
  PERFORM pg_temp.check_eq(
    (SELECT registered::text FROM public.signup_ip_log WHERE email_hash = public.signup_hash_value('mark@x.test')),
    'true', '(d) inserting into auth.users marks the slot registered');
  PERFORM pg_temp.check_eq(
    (SELECT count(*)::text FROM pg_trigger WHERE tgname = 'signup_ip_mark_registered' AND tgrelid = 'auth.users'::regclass),
    '1', 'mark-registered trigger is attached to auth.users');
  PERFORM pg_temp.check_eq(
    (SELECT column_default FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'signup_ip_log' AND column_name = 'registered'),
    'false', 'registered column defaults to false');

  -- Privacy: only hex digests are stored, no raw IP or email anywhere in the tables
  PERFORM pg_temp.check_eq(
    (SELECT count(*)::text FROM public.signup_ip_log
     WHERE ip_hash !~ '^[0-9a-f]{64}$' OR email_hash !~ '^[0-9a-f]{64}$'),
    '0', 'log stores only sha256 hex digests');
  PERFORM pg_temp.check_eq(
    (SELECT count(*)::text FROM public.signup_ip_log WHERE (signup_ip_log)::text ~ '(@|1\.2\.3\.4|2001:db8|\.test)'),
    '0', 'no raw ip or email appears in signup_ip_log');
  PERFORM pg_temp.check_eq(
    (SELECT count(*)::text FROM public.signup_ip_allowlist WHERE (signup_ip_allowlist)::text ~ '(9\.9\.9\.9|@)'),
    '0', 'no raw ip appears in signup_ip_allowlist');
  PERFORM pg_temp.check_eq(
    (SELECT count(*)::text FROM public.signup_ip_log WHERE email_hash = public.signup_hash_value(lower('b@x.test'))),
    '1', 'stored email hash equals sha256 of lower(email)');
  PERFORM pg_temp.check_eq(
    public.signup_ip_hash(' 1.2.3.4 '), public.signup_ip_hash('1.2.3.4'),
    'helper hash is the same after trimming whitespace');

  -- Security configuration
  PERFORM pg_temp.check_eq(
    (SELECT relrowsecurity::text FROM pg_class WHERE oid = 'public.signup_ip_log'::regclass), 'true', 'RLS enabled on signup_ip_log');
  PERFORM pg_temp.check_eq(
    (SELECT relrowsecurity::text FROM pg_class WHERE oid = 'public.signup_ip_allowlist'::regclass), 'true', 'RLS enabled on signup_ip_allowlist');
  PERFORM pg_temp.check_eq(
    (SELECT count(*)::text FROM pg_policies WHERE tablename IN ('signup_ip_log', 'signup_ip_allowlist')), '0', 'no RLS policies on the two tables');
  PERFORM pg_temp.check_eq(
    has_table_privilege('anon', 'public.signup_ip_log', 'SELECT')::text
    || has_table_privilege('authenticated', 'public.signup_ip_log', 'SELECT')::text
    || has_table_privilege('anon', 'public.signup_ip_allowlist', 'INSERT')::text
    || has_table_privilege('authenticated', 'public.signup_ip_allowlist', 'INSERT')::text,
    'falsefalsefalsefalse', 'anon and authenticated have no table access');
  PERFORM pg_temp.check_eq(
    has_table_privilege('supabase_auth_admin', 'public.signup_ip_log', 'SELECT,INSERT,DELETE')::text,
    'true', 'supabase_auth_admin can select, insert and delete the log');
  PERFORM pg_temp.check_eq(
    has_function_privilege('supabase_auth_admin', 'public.hook_before_user_created(jsonb)', 'EXECUTE')::text,
    'true', 'supabase_auth_admin can execute the hook');
  PERFORM pg_temp.check_eq(
    has_function_privilege('anon', 'public.hook_before_user_created(jsonb)', 'EXECUTE')::text
    || has_function_privilege('authenticated', 'public.hook_before_user_created(jsonb)', 'EXECUTE')::text,
    'falsefalse', 'anon and authenticated cannot execute the hook');
  PERFORM pg_temp.check_eq(
    has_function_privilege('anon', 'public.signup_ip_hash(text)', 'EXECUTE')::text
    || has_function_privilege('authenticated', 'public.signup_ip_hash(text)', 'EXECUTE')::text,
    'falsefalse', 'anon and authenticated cannot execute signup_ip_hash');
  PERFORM pg_temp.check_eq(
    (SELECT prosecdef::text FROM pg_proc WHERE oid = 'public.hook_before_user_created(jsonb)'::regprocedure), 'true', 'hook is SECURITY DEFINER');
  PERFORM pg_temp.check_eq(
    (SELECT count(*)::text FROM pg_trigger WHERE tgname = 'signup_ip_release_on_user_delete' AND tgrelid = 'auth.users'::regclass),
    '1', 'delete trigger is attached to auth.users');

  RAISE NOTICE 'ALL signup_ip_limit CHECKS PASSED';
END $$;

ROLLBACK;
