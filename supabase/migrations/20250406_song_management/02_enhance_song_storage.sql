-- Migration: 20250406_song_management/02_enhance_song_storage.sql
-- Description: Enhances storage for song-related files with more specific bucket 
-- organization and access control

-- Create organized sub-folders structure within song-attachments bucket
-- We'll create specific storage policies for different types of song files

-- Policy for chord charts (.pdf, .txt, .png formats typically)
CREATE POLICY "Worship leaders can upload chord charts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'song-attachments' AND
  LOWER(SPLIT_PART(name, '/', 3)) = 'chord-charts' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    AND profiles.church_id::text = SPLIT_PART(name, '/', 1)
  )
);

-- Policy for sheet music (typically .pdf, .musicxml formats)
CREATE POLICY "Worship leaders can upload sheet music"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'song-attachments' AND
  LOWER(SPLIT_PART(name, '/', 3)) = 'sheet-music' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    AND profiles.church_id::text = SPLIT_PART(name, '/', 1)
  )
);

-- Policy for backing tracks (typically .mp3, .wav formats)
CREATE POLICY "Worship leaders can upload backing tracks"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'song-attachments' AND
  LOWER(SPLIT_PART(name, '/', 3)) = 'backing-tracks' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    AND profiles.church_id::text = SPLIT_PART(name, '/', 1)
  )
);

-- Policy for song files deletion
CREATE POLICY "Worship leaders and admins can delete song files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'song-attachments' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    AND profiles.church_id::text = SPLIT_PART(name, '/', 1)
  )
);

-- Create a function to generate a signed URL for song attachments
-- This will allow temporary access to song files even from public contexts
CREATE OR REPLACE FUNCTION get_song_attachment_url(
  song_id TEXT,
  file_path TEXT,
  expiry INTEGER DEFAULT 60
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  church_id TEXT;
  full_path TEXT;
  signed_url TEXT;
BEGIN
  -- Get the church_id for the song
  SELECT songs.church_id::text INTO church_id
  FROM public.songs
  WHERE songs.id::text = song_id;
  
  -- Check if user has access to this church's songs
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.church_id::text = church_id
  ) THEN
    RETURN NULL;
  END IF;
  
  -- Construct the full path
  full_path := church_id || '/' || song_id || '/' || file_path;
  
  -- Generate the signed URL (this part requires proper extension setup in Supabase)
  -- Note: This is placeholder code that would need to be replaced with actual implementation
  -- when the extension for URL signing is available
  -- signed_url := storage.generate_signed_url('song-attachments', full_path, expiry);
  
  -- For now, returning the path that would be used
  RETURN 'song-attachments/' || full_path;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_song_attachment_url TO authenticated;
