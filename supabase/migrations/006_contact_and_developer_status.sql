-- 006: Contact messages + developer application flow
-- 1) contact_messages — user-submitted contact form messages (login required to send)
CREATE TABLE IF NOT EXISTS contact_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL CHECK (length(message) <= 2000),
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Any logged-in user can send a message
CREATE POLICY "contact_auth_insert" ON contact_messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Admins can read and manage messages
CREATE POLICY "contact_admin_read" ON contact_messages FOR SELECT
  USING (is_admin_or_above(auth.uid()));

CREATE POLICY "contact_admin_update" ON contact_messages FOR UPDATE
  USING (is_admin_or_above(auth.uid()));

CREATE POLICY "contact_admin_delete" ON contact_messages FOR DELETE
  USING (is_admin_or_above(auth.uid()));

CREATE INDEX contact_messages_status_idx ON contact_messages(status);

-- 2) profiles.developer_status — tracks the developer application flow
-- 'none' (not applied) | 'pending' (applied, awaiting review) | 'approved' | 'rejected'
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS developer_status TEXT NOT NULL DEFAULT 'none'
  CHECK (developer_status IN ('none', 'pending', 'approved', 'rejected'));

-- 3) Developers can delete their OWN games (e.g. remove a draft they no longer want)
CREATE POLICY "games_developer_delete_own"
  ON games FOR DELETE
  USING (developer_id = auth.uid());
