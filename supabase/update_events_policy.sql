-- Drop existing restrictive policies on the events table
DROP POLICY IF EXISTS "Events can be created by admins or worship leaders" ON public.events;
DROP POLICY IF EXISTS "Events can be updated by creator, admins, or worship leaders" ON public.events;

-- Create new permissive policies for events
CREATE POLICY "Anyone can create events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Events can be updated by any authenticated user"
  ON public.events
  FOR UPDATE
  USING (true);

-- Same for event_songs table
DROP POLICY IF EXISTS "Event songs can be added by event creators or worship leaders" ON public.event_songs;

CREATE POLICY "Anyone can add songs to events"
  ON public.event_songs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update event songs"
  ON public.event_songs
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete event songs"
  ON public.event_songs
  FOR DELETE
  USING (true);
