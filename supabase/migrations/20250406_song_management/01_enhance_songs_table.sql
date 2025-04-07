-- Migration: 20250406_song_management/01_enhance_songs_table.sql
-- Description: Enhances the songs table with additional indexes and policies for the
-- song management feature with chord transposition capabilities

-- Add additional indexes for better performance with song-related queries
CREATE INDEX IF NOT EXISTS idx_songs_title_search ON public.songs USING gin(title gin_trig_ops);
CREATE INDEX IF NOT EXISTS idx_songs_artist_search ON public.songs USING gin(artist gin_trig_ops);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON public.songs(created_at);
CREATE INDEX IF NOT EXISTS idx_songs_created_by ON public.songs(created_by);

-- Create a policy for song deletion
-- Only the creator, worship leaders, or admins of the church can delete songs
CREATE POLICY "Songs can be deleted by creator, worship leaders, or admins"
  ON public.songs
  FOR DELETE
  USING (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = songs.church_id
      AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    )
  );

-- Add a full text search index for searching song lyrics and chords
CREATE INDEX IF NOT EXISTS idx_songs_lyrics_search ON public.songs USING gin(to_tsvector('english', lyrics));
CREATE INDEX IF NOT EXISTS idx_songs_chords_search ON public.songs USING gin(to_tsvector('english', chords));

-- Create a function to search songs by title, artist, lyrics, and chords
CREATE OR REPLACE FUNCTION search_songs(
  search_term TEXT,
  church_id_param UUID
)
RETURNS SETOF public.songs
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.songs
  WHERE 
    church_id = church_id_param
    AND (
      to_tsvector('english', title) @@ plainto_tsquery('english', search_term)
      OR to_tsvector('english', coalesce(artist, '')) @@ plainto_tsquery('english', search_term)
      OR to_tsvector('english', coalesce(lyrics, '')) @@ plainto_tsquery('english', search_term)
      OR to_tsvector('english', coalesce(chords, '')) @@ plainto_tsquery('english', search_term)
    )
  ORDER BY 
    CASE WHEN title ILIKE '%' || search_term || '%' THEN 0
         WHEN artist ILIKE '%' || search_term || '%' THEN 1
         ELSE 2
    END,
    title ASC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_songs TO authenticated;

-- Create function to get songs by key
CREATE OR REPLACE FUNCTION get_songs_by_key(
  key_param TEXT,
  church_id_param UUID
)
RETURNS SETOF public.songs
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.songs
  WHERE 
    church_id = church_id_param
    AND default_key = key_param
  ORDER BY title ASC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_songs_by_key TO authenticated;
