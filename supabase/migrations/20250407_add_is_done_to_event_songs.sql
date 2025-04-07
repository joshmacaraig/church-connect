-- Add is_done column to event_songs table
ALTER TABLE public.event_songs 
ADD COLUMN IF NOT EXISTS is_done BOOLEAN DEFAULT false;

-- Add comment to the column
COMMENT ON COLUMN public.event_songs.is_done IS 'Indicates whether the song has been completed in the service';
