-- Increment game view count (deduplication can be added later with cookies/fingerprinting)
CREATE OR REPLACE FUNCTION increment_view_count(game_id UUID)
RETURNS VOID AS $$
  UPDATE games SET view_count = view_count + 1 WHERE id = game_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Search games full text
CREATE OR REPLACE FUNCTION search_games(query TEXT, limit_n INTEGER DEFAULT 20, offset_n INTEGER DEFAULT 0)
RETURNS SETOF games AS $$
  SELECT * FROM games
  WHERE status = 'approved'
    AND search_vector @@ websearch_to_tsquery('english', query)
  ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', query)) DESC
  LIMIT limit_n
  OFFSET offset_n;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get platform stats
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_games',    (SELECT COUNT(*) FROM games WHERE status = 'approved'),
    'pending_games',  (SELECT COUNT(*) FROM games WHERE status = 'pending'),
    'total_users',    (SELECT COUNT(*) FROM profiles),
    'total_reviews',  (SELECT COUNT(*) FROM game_reviews),
    'open_reports',   (SELECT COUNT(*) FROM reports WHERE status = 'open')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
