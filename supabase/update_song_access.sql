-- Update policy for the songs table to allow anyone to view songs
DO $$
BEGIN
  -- First, check if there's a policy already for selecting from songs
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'songs' AND cmd = 'r'
  ) THEN
    -- Drop existing select policies for songs
    DROP POLICY IF EXISTS "Songs are viewable by anyone" ON public.songs;
    DROP POLICY IF EXISTS "Songs are viewable by church members" ON public.songs;
    -- Any other select policies that might exist
  END IF;

  -- Create new policy allowing anyone to view songs
  CREATE POLICY "Songs are viewable by anyone"
    ON public.songs
    FOR SELECT
    USING (true);  -- This allows any authenticated user to view songs

  RAISE NOTICE 'Successfully updated song viewing permissions to allow everyone access';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating song view policy: %', SQLERRM;
END
$$;

-- Make sure RLS is enabled on the songs table
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
