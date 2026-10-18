-- ============================================================
-- 008: Studios
-- Idempotent: safe to run more than once in the Supabase SQL editor.
-- Games stay linked to studios by name (lower(games.developer_name) =
-- lower(studios.name)); there is no foreign key, so the submit flow is unchanged.
-- ============================================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.studios (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            text NOT NULL UNIQUE
                    CHECK (char_length(slug) BETWEEN 1 AND 80 AND slug ~ '^[a-z0-9-]+$'),
  name            text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  name_ar         text CHECK (name_ar IS NULL OR char_length(name_ar) <= 120),
  logo_url        text CHECK (
                    logo_url IS NULL
                    OR (char_length(logo_url) <= 2048
                        AND (logo_url ~ '^https://' OR logo_url ~ '^/studios/[a-z0-9-]+\.(png|jpg|webp)$'))
                  ),
  about           text CHECK (about IS NULL OR char_length(about) <= 3000),
  about_ar        text CHECK (about_ar IS NULL OR char_length(about_ar) <= 3000),
  founded_year    smallint CHECK (founded_year IS NULL OR founded_year BETWEEN 1970 AND 2100),
  city            text CHECK (city IS NULL OR char_length(city) <= 80),
  website_url     text CHECK (website_url IS NULL OR (char_length(website_url) <= 2048 AND website_url ~ '^https://')),
  steam_url       text CHECK (steam_url IS NULL OR (char_length(steam_url) <= 2048 AND steam_url ~ '^https://')),
  x_url           text CHECK (x_url IS NULL OR (char_length(x_url) <= 2048 AND x_url ~ '^https://')),
  instagram_url   text CHECK (instagram_url IS NULL OR (char_length(instagram_url) <= 2048 AND instagram_url ~ '^https://')),
  facebook_url    text CHECK (facebook_url IS NULL OR (char_length(facebook_url) <= 2048 AND facebook_url ~ '^https://')),
  youtube_url     text CHECK (youtube_url IS NULL OR (char_length(youtube_url) <= 2048 AND youtube_url ~ '^https://')),
  discord_url     text CHECK (discord_url IS NULL OR (char_length(discord_url) <= 2048 AND discord_url ~ '^https://')),
  linkedin_url    text CHECK (linkedin_url IS NULL OR (char_length(linkedin_url) <= 2048 AND linkedin_url ~ '^https://')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS studios_updated_at ON public.studios;
CREATE TRIGGER studios_updated_at BEFORE UPDATE ON public.studios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.studios TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.studios TO authenticated;

DROP POLICY IF EXISTS studios_public_read ON public.studios;
CREATE POLICY studios_public_read ON public.studios
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS studios_admin_insert ON public.studios;
CREATE POLICY studios_admin_insert ON public.studios
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS studios_admin_update ON public.studios;
CREATE POLICY studios_admin_update ON public.studios
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_above(auth.uid()))
  WITH CHECK (public.is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS studios_admin_delete ON public.studios;
CREATE POLICY studios_admin_delete ON public.studios
  FOR DELETE TO authenticated USING (public.is_admin_or_above(auth.uid()));

-- ============================================================
-- Storage: public logo bucket. PNG, JPEG and WebP only (no SVG: XSS risk).
-- ============================================================
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES ('studio-logos', 'studio-logos', true, ARRAY['image/png', 'image/jpeg', 'image/webp'], 2097152)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS studio_logos_public_read ON storage.objects;
CREATE POLICY studio_logos_public_read ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'studio-logos');

DROP POLICY IF EXISTS studio_logos_admin_insert ON storage.objects;
CREATE POLICY studio_logos_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'studio-logos' AND public.is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS studio_logos_admin_update ON storage.objects;
CREATE POLICY studio_logos_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'studio-logos' AND public.is_admin_or_above(auth.uid()))
  WITH CHECK (bucket_id = 'studio-logos' AND public.is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS studio_logos_admin_delete ON storage.objects;
CREATE POLICY studio_logos_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'studio-logos' AND public.is_admin_or_above(auth.uid()));

-- ============================================================
-- Seed: the three studios with verified public facts (see the sources
-- listed in the release notes). Unknown facts stay NULL.
-- ============================================================
INSERT INTO public.studios (
  slug, name, name_ar, logo_url, about, about_ar, founded_year, city,
  website_url, steam_url, x_url, instagram_url, facebook_url, youtube_url, discord_url, linkedin_url
) VALUES
(
  'moving-dimensions', 'Moving Dimensions', NULL, '/studios/moving-dimensions.png',
  'Moving Dimensions is an Egyptian game studio and the developer and publisher of Abo Khashem, a comedic 3D open-world action game set in the City of Torrid. Abo Khashem was released on Steam on 22 February 2018.',
  'استوديو Moving Dimensions مطوّر وناشر ألعاب مصري، وهو مطوّر لعبة أبو خشم، وهي لعبة أكشن ثلاثية الأبعاد بعالم مفتوح وطابع كوميدي. صدرت اللعبة على متجر Steam في 22 فبراير 2018.',
  NULL, NULL,
  'https://www.abokhashem.com', NULL, 'https://twitter.com/AboKhashemGame', NULL,
  'https://www.facebook.com/abokhashemgame', 'https://www.youtube.com/channel/UCmksCHaupG0_dyxeGzG49Hw', NULL, NULL
),
(
  'rumbling-games-studio', 'Rumbling Games Studio', 'استوديو رامبلنج للألعاب', '/studios/rumbling-games-studio.png',
  'Rumbling Games Studio is an Egyptian game studio developing Knights of Light: The Prologue, an action adventure role-playing game set during a seventh-century historical battle in Iraq. The game is available on Steam, and the studio describes Knights of Light as its main project.',
  'استوديو رامبلنج للألعاب استوديو مصري يطوّر لعبة Knights of Light: The Prologue، وهي لعبة أكشن ومغامرات ولعب أدوار تدور أحداثها في الشرق الأوسط خلال معركة تاريخية في القرن السابع. اللعبة متوفرة على متجر Steam، وهي المشروع الرئيسي للاستوديو.',
  NULL, NULL,
  'https://www.rumbling-games.com', NULL, 'https://twitter.com/rumblinggames', 'https://www.instagram.com/rumbling.games.studio',
  'https://www.facebook.com/RumblingGamesStudio', NULL, NULL, NULL
),
(
  'dergham-games', 'Dergham Games', NULL, '/studios/dergham-games.png',
  'Dergham Games is a game studio developing Light Dude, a skill-based action game in which the level hides as the player moves. A playable demo is available on Steam, and the full release is listed for Q4 2026.',
  'ديرغام جيمز استوديو ألعاب يطوّر لعبة Light Dude، وهي لعبة أكشن تعتمد على المهارة، يختفي فيها المستوى كلما تحرك اللاعب. النسخة التجريبية متوفرة على متجر Steam، والإصدار الكامل معلن للربع الرابع من 2026.',
  NULL, NULL,
  NULL, 'https://store.steampowered.com/developer/DerghamGames/', NULL, NULL, NULL, NULL,
  'https://discord.gg/GKMBQh4935', NULL
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
