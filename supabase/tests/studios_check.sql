-- Studios verification checklist for migration 008_studios.sql.
-- Safe to run after the migration in the Supabase SQL editor: the SELECTs are read-only,
-- and the constraint checks at the bottom run inside a transaction that is rolled back.
-- Expected results are noted above each query.

-- 1. Table exists with RLS enabled. Expected: rowsecurity = true.
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'studios';

-- 2. Policies on public.studios. Expected: studios_public_read (SELECT, anon+authenticated),
--    and studios_admin_insert / studios_admin_update / studios_admin_delete (authenticated, is_admin_or_above).
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'studios' ORDER BY policyname;

-- 3. Seeded studios. Expected: 3 rows (moving-dimensions, rumbling-games-studio, dergham-games).
SELECT slug, name, name_ar, logo_url, website_url, steam_url, x_url, facebook_url, instagram_url, youtube_url, discord_url
FROM public.studios ORDER BY slug;

-- 4. Games link to studios by name. Expected: one row per studio with its approved game count (0 if none).
SELECT s.slug, count(g.id) AS approved_games
FROM public.studios s
LEFT JOIN public.games g ON lower(g.developer_name) = lower(s.name) AND g.status = 'approved'
GROUP BY s.slug ORDER BY s.slug;

-- 5. Storage bucket. Expected: public = true, file_size_limit = 2097152,
--    allowed_mime_types = {image/png,image/jpeg,image/webp}.
SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'studio-logos';

-- 6. Storage policies for the bucket. Expected: studio_logos_public_read (SELECT) plus
--    studio_logos_admin_insert / _update / _delete, all gated on is_admin_or_above.
SELECT policyname, cmd, roles FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'studio_logos_%' ORDER BY policyname;

-- 7. Updated_at trigger. Expected: one row, studios_updated_at, BEFORE UPDATE.
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.studios'::regclass AND NOT tgisinternal;

-- 8. Constraint checks. Each block must raise and be rolled back; a NOTICE 'rejected as expected'
--    means the constraint works. Nothing persists.
BEGIN;
DO $$
DECLARE
  ok boolean;
BEGIN
  BEGIN
    INSERT INTO public.studios (slug, name) VALUES ('Bad Slug', 'x');
    RAISE EXCEPTION 'slug check failed to reject uppercase/space';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'slug format rejected as expected'; END;

  BEGIN
    INSERT INTO public.studios (slug, name, website_url) VALUES ('tst-http', 'x', 'http://example.com');
    RAISE EXCEPTION 'website check failed to reject http://';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'http website rejected as expected'; END;

  BEGIN
    INSERT INTO public.studios (slug, name, logo_url) VALUES ('tst-svg', 'x', '/studios/tst.svg');
    RAISE EXCEPTION 'logo check failed to reject svg';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'svg logo rejected as expected'; END;

  BEGIN
    INSERT INTO public.studios (slug, name, founded_year) VALUES ('tst-year', 'x', 1960);
    RAISE EXCEPTION 'founded_year check failed to reject 1960';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'founded_year out of range rejected as expected'; END;

  BEGIN
    INSERT INTO public.studios (slug, name, about) VALUES ('tst-about', 'x', repeat('a', 3001));
    RAISE EXCEPTION 'about check failed to reject 3001 chars';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'about over 3000 chars rejected as expected'; END;
END $$;
ROLLBACK;
