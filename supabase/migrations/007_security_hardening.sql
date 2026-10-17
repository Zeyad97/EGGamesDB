BEGIN;

-- SECURITY DEFINER routines run with a deterministic search path.
CREATE TABLE IF NOT EXISTS public.game_view_limits(
  user_id uuid NOT NULL, game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  last_counted_at timestamptz NOT NULL, PRIMARY KEY(user_id,game_id));
ALTER TABLE public.game_view_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_view_limits FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION get_user_role(uid uuid) RETURNS user_role
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp AS $$
  SELECT role FROM public.profiles WHERE id = uid
$$;
CREATE OR REPLACE FUNCTION is_admin_or_above(uid uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp AS $$
  SELECT COALESCE(role IN ('admin','super_admin'), false) FROM public.profiles WHERE id = uid
$$;
CREATE OR REPLACE FUNCTION increment_view_count(game_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE uid uuid := auth.uid(); counted_at timestamptz := now();
BEGIN
  -- Count at most once per authenticated user/game per 15 minutes; anonymous callers are rejected.
  IF uid IS NULL THEN RETURN; END IF;
  INSERT INTO public.game_view_limits(user_id,game_id,last_counted_at) VALUES(uid,game_id,counted_at)
  ON CONFLICT(user_id,game_id) DO UPDATE SET last_counted_at=EXCLUDED.last_counted_at
  WHERE public.game_view_limits.last_counted_at < counted_at - interval '15 minutes';
  IF FOUND THEN UPDATE public.games SET view_count=view_count+1 WHERE id=game_id AND status='approved'; END IF;
END $$;
CREATE OR REPLACE FUNCTION increment_view_count_server(game_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  -- Server-side view counting for anonymous visitors: the public page calls
  -- this via the service role after an application-level rate-limit check.
  -- Only approved games are counted.
  UPDATE public.games SET view_count=view_count+1 WHERE id=game_id AND status='approved';
END $$;
CREATE OR REPLACE FUNCTION search_games(query text, limit_n integer DEFAULT 20, offset_n integer DEFAULT 0)
RETURNS SETOF games LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp AS $$
  SELECT * FROM public.games WHERE status = 'approved'
    AND search_vector @@ websearch_to_tsquery('english', query)
  ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', query)) DESC
  LIMIT LEAST(GREATEST(limit_n, 0), 50) OFFSET GREATEST(offset_n, 0)
$$;
CREATE OR REPLACE FUNCTION get_platform_stats() RETURNS json
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp AS $$
  SELECT json_build_object(
    'total_games',(SELECT count(*) FROM public.games WHERE status='approved'),
    'pending_games',(SELECT count(*) FROM public.games WHERE status='pending'),
    'total_users',(SELECT count(*) FROM public.profiles),
    'total_reviews',(SELECT count(*) FROM public.game_reviews),
    'open_reports',(SELECT count(*) FROM public.reports WHERE status='open'))
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE base_username text; final_username text; safe_name text; safe_avatar text; counter integer := 0;
BEGIN
  base_username := lower(regexp_replace(split_part(NEW.email,'@',1),'[^a-zA-Z0-9_-]','','g'));
  IF length(base_username) < 3 THEN base_username := 'user'; END IF;
  base_username := left(base_username, 25);
  safe_name := left(coalesce(nullif(btrim(NEW.raw_user_meta_data->>'display_name'),''), base_username),60);
  safe_avatar := NEW.raw_user_meta_data->>'avatar_url';
  IF safe_avatar IS NULL OR length(safe_avatar) > 2048 OR safe_avatar !~ '^https://' THEN safe_avatar := NULL; END IF;
  final_username := base_username;
  LOOP
    BEGIN
      INSERT INTO public.profiles(id,username,display_name,avatar_url)
      VALUES(NEW.id,final_username,safe_name,safe_avatar);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      counter := counter + 1;
      final_username := left(base_username,25-length(counter::text)) || counter::text;
    END;
  END LOOP;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.increment_view_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_view_count(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_view_count_server(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count_server(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_platform_stats() FROM PUBLIC, anon;
-- RLS policies such as games_public_read_approved evaluate
-- is_admin_or_above(auth.uid()) and get_user_role(auth.uid()) for anonymous
-- visitors (auth.uid() IS NULL), so both helpers must stay EXECUTE-able by
-- anon as well as authenticated; otherwise anon reads fail with
-- "permission denied for function".
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_above(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_above(uuid) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.search_games(text,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_games(text,integer,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.security_is_service_role() RETURNS boolean
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
 SELECT coalesce(auth.role() = 'service_role', current_setting('request.jwt.claim.role', true) = 'service_role', false)
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_security_fields() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE actor_role user_role; is_service boolean;
BEGIN
  is_service := public.security_is_service_role();
  IF is_service THEN RETURN NEW; END IF;
  actor_role := public.get_user_role(auth.uid());
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'immutable profile field';
  END IF;
  IF actor_role IS NULL OR actor_role NOT IN ('admin','super_admin') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN RAISE EXCEPTION 'role changes are restricted'; END IF;
    IF NEW.developer_status IS DISTINCT FROM OLD.developer_status
      AND NOT (OLD.id = auth.uid() AND OLD.developer_status IN ('none','rejected') AND NEW.developer_status = 'pending') THEN
      RAISE EXCEPTION 'developer status changes are restricted';
    END IF;
  ELSE
    IF OLD.role = 'super_admin' AND auth.uid() <> OLD.id AND actor_role <> 'super_admin' THEN
      RAISE EXCEPTION 'only a super admin may modify a super admin';
    END IF;
    IF actor_role <> 'super_admin' AND NEW.role IS DISTINCT FROM OLD.role AND
      (OLD.role IN ('admin','super_admin') OR NEW.role IN ('admin','super_admin')) THEN
      RAISE EXCEPTION 'only a super admin may grant or revoke privileged roles';
    END IF;
    IF actor_role <> 'super_admin' AND OLD.role = 'super_admin' THEN RAISE EXCEPTION 'only a super admin may modify a super admin'; END IF;
  END IF;
  IF OLD.role='super_admin' AND NEW.role <> 'super_admin'
    AND (SELECT count(*) FROM public.profiles WHERE role='super_admin') <= 1 THEN
    RAISE EXCEPTION 'cannot remove the last super admin';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS profiles_security_fields ON public.profiles;
CREATE TRIGGER profiles_security_fields BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_security_fields();
CREATE OR REPLACE FUNCTION public.protect_last_super_admin_delete() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$ BEGIN
 IF OLD.role='super_admin' AND (SELECT count(*) FROM public.profiles WHERE role='super_admin') <= 1 THEN
   RAISE EXCEPTION 'cannot delete the last super admin';
 END IF;
 RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS profiles_last_super_admin_delete ON public.profiles;
CREATE TRIGGER profiles_last_super_admin_delete BEFORE DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_last_super_admin_delete();

DROP POLICY IF EXISTS profiles_own_update ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_own_update ON public.profiles FOR UPDATE TO authenticated
USING (id=auth.uid()) WITH CHECK (id=auth.uid());
CREATE POLICY profiles_admin_update ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin_or_above(auth.uid())) WITH CHECK (public.is_admin_or_above(auth.uid()));

CREATE OR REPLACE FUNCTION public.protect_game_fields() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE admin_ok boolean; actor uuid;
BEGIN
  IF public.security_is_service_role() THEN RETURN NEW; END IF;
  actor := auth.uid();
  admin_ok := public.is_admin_or_above(actor);
  IF admin_ok THEN
    IF public.get_user_role(actor) <> 'super_admin' AND NEW.status='approved' AND NEW.status IS DISTINCT FROM OLD.status
      AND OLD.status NOT IN ('pending','rejected','draft') THEN RAISE EXCEPTION 'invalid game transition'; END IF;
    RETURN NEW;
  END IF;
  IF TG_OP='INSERT' THEN
    IF NEW.developer_id IS DISTINCT FROM actor OR NEW.status NOT IN ('draft','pending') THEN RAISE EXCEPTION 'invalid game submission'; END IF;
    IF NEW.reviewed_by IS NOT NULL OR NEW.reviewed_at IS NOT NULL OR NEW.spotlight_at IS NOT NULL OR
       NEW.rejection_reason IS NOT NULL OR NEW.view_count <> 0 OR NEW.rating_count <> 0 OR NEW.average_rating <> 0 OR NEW.metacritic_score IS NOT NULL THEN
       RAISE EXCEPTION 'protected game fields cannot be set';
    END IF;
  ELSE
    IF NEW.developer_id IS DISTINCT FROM OLD.developer_id OR OLD.developer_id IS DISTINCT FROM actor THEN RAISE EXCEPTION 'cannot change game owner'; END IF;
    IF NEW.status IS DISTINCT FROM OLD.status AND NOT (OLD.status='draft' AND NEW.status='pending') AND NOT (OLD.status='pending' AND NEW.status='draft') AND NOT (OLD.status='rejected' AND NEW.status='pending') THEN RAISE EXCEPTION 'invalid game status transition'; END IF;
    IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at OR
       NEW.spotlight_at IS DISTINCT FROM OLD.spotlight_at OR
       NEW.view_count IS DISTINCT FROM OLD.view_count OR NEW.rating_count IS DISTINCT FROM OLD.rating_count OR
       NEW.average_rating IS DISTINCT FROM OLD.average_rating OR NEW.metacritic_score IS DISTINCT FROM OLD.metacritic_score THEN
       RAISE EXCEPTION 'protected game fields cannot be changed';
    END IF;
    -- Owners may clear the rejection reason only when resubmitting a rejected game.
    IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason AND NOT
      (OLD.status='rejected' AND NEW.status='pending' AND NEW.rejection_reason IS NULL) THEN
      RAISE EXCEPTION 'protected game fields cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS games_protect_fields ON public.games;
CREATE TRIGGER games_protect_fields BEFORE INSERT OR UPDATE ON public.games
FOR EACH ROW EXECUTE FUNCTION public.protect_game_fields();
DROP POLICY IF EXISTS games_contributor_insert ON public.games;
CREATE POLICY games_contributor_insert ON public.games FOR INSERT TO authenticated WITH CHECK (
  public.get_user_role(auth.uid()) IN ('contributor','admin','super_admin') AND
  (public.is_admin_or_above(auth.uid()) OR (developer_id=auth.uid() AND status IN ('draft','pending') AND
   reviewed_by IS NULL AND reviewed_at IS NULL AND rejection_reason IS NULL AND spotlight_at IS NULL AND
   view_count=0 AND rating_count=0 AND average_rating=0 AND metacritic_score IS NULL)));
DROP POLICY IF EXISTS games_own_update ON public.games;
CREATE POLICY games_own_update ON public.games FOR UPDATE TO authenticated
USING ((developer_id=auth.uid() AND status IN ('draft','pending','rejected')) OR public.is_admin_or_above(auth.uid()))
WITH CHECK ((developer_id=auth.uid() AND status IN ('draft','pending','rejected')) OR public.is_admin_or_above(auth.uid()));
DROP POLICY IF EXISTS games_developer_delete_own ON public.games;
CREATE POLICY games_developer_delete_own ON public.games FOR DELETE TO authenticated
USING (developer_id=auth.uid() AND status IN ('draft','rejected'));

DROP POLICY IF EXISTS reviews_own_update ON public.game_reviews;
CREATE POLICY reviews_own_update ON public.game_reviews FOR UPDATE TO authenticated
USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE OR REPLACE FUNCTION public.protect_review_identity() RETURNS trigger LANGUAGE plpgsql
SET search_path = public, pg_temp AS $$ BEGIN
 IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.game_id IS DISTINCT FROM OLD.game_id OR NEW.helpful_count IS DISTINCT FROM OLD.helpful_count THEN RAISE EXCEPTION 'review identity and counters are immutable'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS review_identity_guard ON public.game_reviews;
CREATE TRIGGER review_identity_guard BEFORE UPDATE ON public.game_reviews FOR EACH ROW EXECUTE FUNCTION public.protect_review_identity();

DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_above(auth.uid()));
DROP POLICY IF EXISTS reports_auth_insert ON public.reports;
CREATE POLICY reports_auth_insert ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid()=reporter_id AND status='open' AND resolved_by IS NULL);

-- One row-level insert throttle per user and minute for user-generated content.
CREATE TABLE IF NOT EXISTS public.security_insert_limits(user_id uuid NOT NULL, bucket text NOT NULL, minute timestamptz NOT NULL, n integer NOT NULL, PRIMARY KEY(user_id,bucket,minute));
ALTER TABLE public.security_insert_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_insert_limits FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.enforce_user_insert_rate() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE uid uuid := auth.uid(); b text := TG_TABLE_NAME; current_minute timestamptz := date_trunc('minute',now()); cap integer := 5; n integer;
BEGIN
 IF public.security_is_service_role() THEN RETURN NEW; END IF;
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
 IF b='game_reviews' THEN cap:=5; ELSIF b='reports' THEN cap:=3; ELSIF b='contact_messages' THEN cap:=3; END IF;
 INSERT INTO public.security_insert_limits VALUES(uid,b,current_minute,1)
 ON CONFLICT(user_id,bucket,minute) DO UPDATE SET n=security_insert_limits.n+1 RETURNING n INTO n;
 IF n>cap THEN RAISE EXCEPTION 'rate limit exceeded'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS review_insert_rate ON public.game_reviews;
CREATE TRIGGER review_insert_rate BEFORE INSERT ON public.game_reviews FOR EACH ROW EXECUTE FUNCTION public.enforce_user_insert_rate();
DROP TRIGGER IF EXISTS report_insert_rate ON public.reports;
CREATE TRIGGER report_insert_rate BEFORE INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.enforce_user_insert_rate();
DO $$ BEGIN IF to_regclass('public.contact_messages') IS NOT NULL THEN
  DROP TRIGGER IF EXISTS contact_insert_rate ON public.contact_messages;
  CREATE TRIGGER contact_insert_rate BEFORE INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.enforce_user_insert_rate();
  ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_name_length;
  ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_name_length CHECK(length(name) BETWEEN 1 AND 100);
  ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_email_length;
  ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_email_length CHECK(length(email) BETWEEN 3 AND 254);
  ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_subject_length;
  ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_subject_length CHECK(length(subject) BETWEEN 1 AND 200);
END IF; END $$;

DROP POLICY IF EXISTS game_assets_auth_upload ON storage.objects;
DROP POLICY IF EXISTS game_assets_owner_update ON storage.objects;
DROP POLICY IF EXISTS game_assets_owner_delete ON storage.objects;
CREATE POLICY game_assets_auth_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK (
 bucket_id='game-assets' AND (storage.foldername(name))[1]=auth.uid()::text AND
 (public.get_user_role(auth.uid()) IN ('contributor','admin','super_admin')));
CREATE POLICY game_assets_owner_update ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='game-assets' AND owner_id=auth.uid()::text)
WITH CHECK(bucket_id='game-assets' AND owner_id=auth.uid()::text);
CREATE POLICY game_assets_owner_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='game-assets' AND owner_id=auth.uid()::text);
DROP POLICY IF EXISTS avatars_own_upload ON storage.objects;
DROP POLICY IF EXISTS avatars_owner_update ON storage.objects;
DROP POLICY IF EXISTS avatars_owner_delete ON storage.objects;
CREATE POLICY avatars_own_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY avatars_owner_update ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='avatars' AND owner_id=auth.uid()::text)
WITH CHECK(bucket_id='avatars' AND owner_id=auth.uid()::text);
CREATE POLICY avatars_owner_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='avatars' AND owner_id=auth.uid()::text);
UPDATE storage.buckets SET allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp','image/gif'], file_size_limit=10485760 WHERE id='game-assets';
UPDATE storage.buckets SET allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp','image/gif'], file_size_limit=2097152 WHERE id='avatars';

-- Notify moderators from a trusted database trigger rather than granting a submitter notification writes.
CREATE OR REPLACE FUNCTION public.notify_admins_game_submission() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
 IF NEW.status='pending' THEN
   INSERT INTO public.notifications(user_id,title,message,type,action_url)
   SELECT id,'New Game Submission',left('A game was submitted for review',240),'info','/admin'
   FROM public.profiles WHERE role IN ('admin','super_admin');
 END IF;
 RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_admins_game_submission() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS notify_admins_game_submission ON public.games;
CREATE TRIGGER notify_admins_game_submission AFTER INSERT ON public.games
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_game_submission();

COMMIT;

-- Verification helpers (run manually after applying):
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname IN ('public','storage') ORDER BY schemaname,tablename,policyname;
-- SELECT proname, prosecdef, proconfig FROM pg_proc JOIN pg_namespace n ON n.oid=pronamespace WHERE n.nspname='public' AND prosecdef;
