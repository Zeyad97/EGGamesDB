BEGIN;

-- ============================================================
-- 011 SIGN-UP LIMIT PER NETWORK
--    At most N accounts (default 2, see hook_before_user_created) per
--    network: an IPv4 address, or an IPv6 /64. Enforced by a Supabase Auth
--    "Before User Created" hook, so it cannot be bypassed by calling the
--    signup API directly. Setup steps: supabase/hooks/README.md.
--    Only one-way hashes are stored (never a raw IP or email).
--    Requires the Supabase roles anon, authenticated and service_role.
-- ============================================================

-- ------------------------------------------------------------
-- 1) TABLES (RLS on, no policies, no access for client roles)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.signup_ip_log (
  ip_hash text NOT NULL,
  email_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ip_hash, email_hash)
);

-- registered = true once an auth.users row exists for the email (set by the
-- signup_ip_mark_registered trigger). Only registered rows hold a slot forever;
-- unregistered rows (typos, abandoned attempts) hold one for 1 hour.
ALTER TABLE public.signup_ip_log ADD COLUMN IF NOT EXISTS registered boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.signup_ip_allowlist (
  ip_hash text PRIMARY KEY,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.signup_ip_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_ip_allowlist ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.signup_ip_log FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.signup_ip_allowlist FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
    GRANT SELECT, INSERT, DELETE ON public.signup_ip_log TO supabase_auth_admin;
    GRANT SELECT, INSERT, DELETE ON public.signup_ip_allowlist TO supabase_auth_admin;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2) HELPERS
--    signup_ip_normalize: IPv4 as is; IPv4-mapped IPv6 as IPv4;
--    other IPv6 reduced to its /64. Returns NULL if unusable.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.signup_ip_normalize(raw_ip text) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp AS $$
DECLARE
  addr inet;
  txt text;
  v4 text;
BEGIN
  IF raw_ip IS NULL OR btrim(raw_ip) = '' THEN
    RETURN NULL;
  END IF;
  addr := btrim(raw_ip)::inet;
  txt := host(addr);
  v4 := substring(txt FROM '^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$');
  IF v4 IS NOT NULL THEN
    RETURN v4;
  END IF;
  IF family(addr) = 6 THEN
    RETURN host(network(set_masklen(addr, 64)));
  END IF;
  RETURN txt;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END $$;

-- One-way hash: sha256 of the value plus a fixed tag. Used for IPs and emails.
CREATE OR REPLACE FUNCTION public.signup_hash_value(value text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp AS $$
  SELECT encode(sha256(convert_to(value || ':egdb-signup-v1', 'utf8')), 'hex')
$$;

-- Owner tool: hash an IP so it can be allowlisted. Service role / SQL editor only.
CREATE OR REPLACE FUNCTION public.signup_ip_hash(ip text) RETURNS text
LANGUAGE plpgsql STABLE SET search_path = public, pg_temp AS $$
DECLARE
  norm text;
BEGIN
  norm := public.signup_ip_normalize(ip);
  IF norm IS NULL THEN
    RAISE EXCEPTION 'signup_ip_hash: not a valid IP address';
  END IF;
  RETURN public.signup_hash_value(norm);
END $$;

-- ------------------------------------------------------------
-- 3) BEFORE USER CREATED HOOK
--    Returns {} to allow, or an error object to reject. The message
--    "signup_limit_reached" reaches the browser (see register/page.tsx).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hook_before_user_created(event jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  -- Accounts allowed per network. To change the limit, edit this number
  -- and run this migration again (CREATE OR REPLACE is safe to repeat).
  max_accounts int := 2;
  -- How long an attempt that has not become an account holds a slot.
  hold_for interval := interval '1 hour';
  norm_ip text;
  ip_h text;
  email_h text;
  used int;
BEGIN
  -- Fail open: an email-less or unreadable request is never blocked here.
  IF coalesce(btrim(event #>> '{user,email}'), '') = '' THEN
    RETURN '{}'::jsonb;
  END IF;

  norm_ip := public.signup_ip_normalize(event #>> '{metadata,ip_address}');
  -- Fail open: a missing or unparseable IP header never blocks sign-ups.
  IF norm_ip IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  ip_h := public.signup_hash_value(norm_ip);
  email_h := public.signup_hash_value(lower(btrim(event #>> '{user,email}')));

  -- Owner-allowlisted networks are never limited.
  IF EXISTS (SELECT 1 FROM public.signup_ip_allowlist WHERE ip_hash = ip_h) THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Serialise sign-ups from the same network so the count below is exact.
  PERFORM pg_advisory_xact_lock(hashtext(ip_h));

  -- Attempts that never became accounts (typos, abandoned sign-ups) stop
  -- holding a slot after the hold period. Registered rows are never purged.
  -- The same email is purged too: a stale attempt is a new attempt, so it
  -- cannot slip past a limit that other accounts have since filled.
  DELETE FROM public.signup_ip_log
  WHERE ip_hash = ip_h AND registered = false AND created_at < now() - hold_for;

  -- Same email again from this network while its attempt is still fresh (for
  -- example, a retry after a failed confirmation email): allowed, and it does
  -- not use another slot.
  IF EXISTS (SELECT 1 FROM public.signup_ip_log WHERE ip_hash = ip_h AND email_hash = email_h) THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Slots in use: registered accounts (until deleted) and fresh attempts.
  SELECT count(DISTINCT email_hash) INTO used
  FROM public.signup_ip_log
  WHERE ip_hash = ip_h AND (registered OR created_at >= now() - hold_for);

  IF used >= max_accounts THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object('http_code', 429, 'message', 'signup_limit_reached')
    );
  END IF;

  INSERT INTO public.signup_ip_log (ip_hash, email_hash)
  VALUES (ip_h, email_h)
  ON CONFLICT DO NOTHING;

  RETURN '{}'::jsonb;
END $$;

-- ------------------------------------------------------------
-- 4) FREE THE SLOT WHEN AN ACCOUNT IS DELETED
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.signup_ip_release_on_user_delete() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF OLD.email IS NOT NULL THEN
    DELETE FROM public.signup_ip_log
    WHERE email_hash = public.signup_hash_value(lower(btrim(OLD.email)));
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS signup_ip_release_on_user_delete ON auth.users;
CREATE TRIGGER signup_ip_release_on_user_delete
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.signup_ip_release_on_user_delete();

-- ------------------------------------------------------------
-- 4b) MARK A SLOT AS REGISTERED WHEN THE ACCOUNT IS ACTUALLY CREATED
--     The hook runs before the user exists, so every attempt first gets an
--     unregistered row. This trigger flips it once auth.users has the email.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.signup_ip_mark_registered() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    UPDATE public.signup_ip_log
    SET registered = true
    WHERE email_hash = public.signup_hash_value(lower(btrim(NEW.email)))
      AND registered = false;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS signup_ip_mark_registered ON auth.users;
CREATE TRIGGER signup_ip_mark_registered
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.signup_ip_mark_registered();

-- Backfill (safe to re-run): rows for emails that already have an account
-- stay counted as registered.
UPDATE public.signup_ip_log l
SET registered = true
WHERE l.registered = false
  AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.email IS NOT NULL
      AND public.signup_hash_value(lower(btrim(u.email))) = l.email_hash
  );

-- ------------------------------------------------------------
-- 5) PRIVILEGES
--    The hook runs as supabase_auth_admin. It is SECURITY DEFINER, so it
--    runs as the table owner; RLS (no policies) therefore blocks only
--    direct client access.
-- ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.signup_ip_normalize(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.signup_hash_value(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.signup_ip_release_on_user_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.signup_ip_mark_registered() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.signup_ip_hash(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hook_before_user_created(jsonb) FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.signup_ip_hash(text) TO service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
    GRANT EXECUTE ON FUNCTION public.hook_before_user_created(jsonb) TO supabase_auth_admin;
  END IF;
END $$;

COMMIT;
