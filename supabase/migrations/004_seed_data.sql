-- Sample seed data for development testing only
-- Run this only on your local development Supabase instance

-- Example: Update a user to super_admin after they sign up
-- UPDATE profiles SET role = 'super_admin' WHERE username = 'yourusername';

-- Example genres used in the platform
-- No actual data is seeded — games are added by contributors via the platform
COMMENT ON TABLE games IS 'Egyptian games available on Steam, curated by the community';
COMMENT ON TABLE profiles IS 'User profiles for EGGameDB contributors and admins';
