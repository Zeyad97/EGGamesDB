-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE games         ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_reviews  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs    ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin_or_above(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'super_admin') FROM profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- PROFILES ----
CREATE POLICY "profiles_public_read"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_update"    ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_update"  ON profiles FOR UPDATE USING (is_admin_or_above(auth.uid()));

-- ---- GAMES ----
CREATE POLICY "games_public_read_approved"
  ON games FOR SELECT
  USING (status = 'approved' OR developer_id = auth.uid() OR is_admin_or_above(auth.uid()));

CREATE POLICY "games_contributor_insert"
  ON games FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    get_user_role(auth.uid()) IN ('contributor', 'admin', 'super_admin')
  );

CREATE POLICY "games_own_update"
  ON games FOR UPDATE
  USING (
    (developer_id = auth.uid() AND status IN ('draft', 'rejected')) OR
    is_admin_or_above(auth.uid())
  );

CREATE POLICY "games_admin_delete"
  ON games FOR DELETE
  USING (is_admin_or_above(auth.uid()));

-- ---- GAME REVIEWS ----
CREATE POLICY "reviews_public_read"   ON game_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_auth_insert"   ON game_reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "reviews_own_update"    ON game_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_own_delete"    ON game_reviews FOR DELETE USING (auth.uid() = user_id OR is_admin_or_above(auth.uid()));

-- ---- REPORTS ----
CREATE POLICY "reports_auth_insert"   ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = reporter_id);
CREATE POLICY "reports_admin_read"    ON reports FOR SELECT USING (is_admin_or_above(auth.uid()));
CREATE POLICY "reports_admin_update"  ON reports FOR UPDATE USING (is_admin_or_above(auth.uid()));

-- ---- NOTIFICATIONS ----
CREATE POLICY "notifications_own"     ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update"  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ---- AUDIT LOGS ----
CREATE POLICY "audit_admin_read"      ON audit_logs FOR SELECT USING (is_admin_or_above(auth.uid()));

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('game-assets', 'game-assets', true),
  ('avatars',     'avatars',     true);

CREATE POLICY "game_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'game-assets');

CREATE POLICY "game_assets_auth_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'game-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_own_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::TEXT);
