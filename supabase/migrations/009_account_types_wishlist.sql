BEGIN;

-- ============================================================
-- 1) ACCOUNT TYPES
--    'player' (default) or 'studio'. 'studio' accounts get the developer
--    workflow; 'player' accounts get the wishlist-centred profile.
--    The column is independent of `role`: switching never changes role.
-- ============================================================
DO $$
BEGIN
  -- Backfill runs only when this migration adds the column, so re-running
  -- the migration never overwrites a choice a user has made since.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'player';
    UPDATE public.profiles SET account_type = 'studio'
    WHERE role IN ('contributor', 'admin', 'super_admin') OR developer_status IN ('pending', 'approved');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_account_type_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_type_check
      CHECK (account_type IN ('player', 'studio'));
  END IF;
END $$;

-- ============================================================
-- 2) SIGN-UP TRIGGER FUNCTION (007 definition + account type)
--    account_type comes from user metadata; anything other than 'studio'
--    becomes 'player'. role is never read from metadata.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE base_username text; final_username text; safe_name text; safe_avatar text; counter integer := 0;
        safe_account_type text; safe_developer_status text;
BEGIN
  base_username := lower(regexp_replace(split_part(NEW.email,'@',1),'[^a-zA-Z0-9_-]','','g'));
  IF length(base_username) < 3 THEN base_username := 'user'; END IF;
  base_username := left(base_username, 25);
  safe_name := left(coalesce(nullif(btrim(NEW.raw_user_meta_data->>'display_name'),''), base_username),60);
  safe_avatar := NEW.raw_user_meta_data->>'avatar_url';
  IF safe_avatar IS NULL OR length(safe_avatar) > 2048 OR safe_avatar !~ '^https://' THEN safe_avatar := NULL; END IF;
  safe_account_type := CASE WHEN NEW.raw_user_meta_data->>'account_type' = 'studio' THEN 'studio' ELSE 'player' END;
  -- A studio sign-up is a developer application: the admin sees it as pending.
  safe_developer_status := CASE WHEN safe_account_type = 'studio' THEN 'pending' ELSE 'none' END;
  final_username := base_username;
  LOOP
    BEGIN
      INSERT INTO public.profiles(id,username,display_name,avatar_url,account_type,developer_status)
      VALUES(NEW.id,final_username,safe_name,safe_avatar,safe_account_type,safe_developer_status);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      counter := counter + 1;
      final_username := left(base_username,25-length(counter::text)) || counter::text;
    END;
  END LOOP;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 3) PROFILE SECURITY TRIGGER (007 logic intact + account type)
--    A non-admin may change their OWN account_type. Switching to 'studio'
--    from 'none' or 'rejected' starts a developer application (pending).
--    Switching never changes role.
-- ============================================================
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
    IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
      IF OLD.id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'account type changes are restricted'; END IF;
      IF NEW.account_type = 'studio' AND OLD.developer_status IN ('none','rejected') THEN
        NEW.developer_status := 'pending';
      END IF;
    END IF;
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

-- ============================================================
-- 4) WISHLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id    uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id)
);
CREATE INDEX IF NOT EXISTS wishlists_game_id_idx ON public.wishlists(game_id);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wishlists FROM PUBLIC, anon;
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;

DROP POLICY IF EXISTS wishlists_own_select ON public.wishlists;
DROP POLICY IF EXISTS wishlists_own_insert ON public.wishlists;
DROP POLICY IF EXISTS wishlists_own_delete ON public.wishlists;
CREATE POLICY wishlists_own_select ON public.wishlists FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY wishlists_own_insert ON public.wishlists FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.games g WHERE g.id = public.wishlists.game_id AND g.status = 'approved')
  );
CREATE POLICY wishlists_own_delete ON public.wishlists FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Public wishlist count: approved games only, no per-user data exposed.
CREATE OR REPLACE FUNCTION public.wishlist_count(game_id uuid) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT count(*)::integer
  FROM public.wishlists w
  JOIN public.games g ON g.id = w.game_id
  WHERE w.game_id = wishlist_count.game_id AND g.status = 'approved'
$$;
REVOKE EXECUTE ON FUNCTION public.wishlist_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wishlist_count(uuid) TO anon, authenticated;

COMMIT;

-- Verification helpers (run manually after applying):
-- SELECT account_type, count(*) FROM public.profiles GROUP BY 1;
-- SELECT conname FROM pg_constraint WHERE conname='profiles_account_type_check';
-- SELECT policyname, cmd FROM pg_policies WHERE tablename='wishlists';
