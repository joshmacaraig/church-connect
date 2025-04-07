-- Enable Row Level Security (RLS) for all tables

-- Profiles Table RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view profiles in their church"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles AS viewer 
      WHERE viewer.id = auth.uid() 
      AND viewer.church_id = profiles.church_id
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Churches Table RLS
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Churches are viewable by authenticated users"
  ON public.churches
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Churches can be created by authenticated users"
  ON public.churches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Churches can be updated by their creator or admins"
  ON public.churches
  FOR UPDATE
  USING (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
      AND profiles.church_id = churches.id
    )
  );

-- Worship Teams Table RLS
ALTER TABLE public.worship_teams ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Teams are viewable by church members"
  ON public.worship_teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = worship_teams.church_id
    )
  );

CREATE POLICY "Teams can be created by admins or worship leaders"
  ON public.worship_teams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = NEW.church_id
      AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    )
  );

CREATE POLICY "Teams can be updated by admins or worship leaders"
  ON public.worship_teams
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = worship_teams.church_id
      AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    )
  );

-- Team Members Table RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members are viewable by church members"
  ON public.team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.worship_teams
      JOIN public.profiles ON profiles.church_id = worship_teams.church_id
      WHERE worship_teams.id = team_members.team_id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Team members can be added by team admins"
  ON public.team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.worship_teams
      JOIN public.profiles ON profiles.id = auth.uid()
      WHERE worship_teams.id = NEW.team_id
      AND worship_teams.church_id = profiles.church_id
      AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    )
  );

-- Events Table RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by church members"
  ON public.events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = events.church_id
    )
  );

CREATE POLICY "Events can be created by admins or worship leaders"
  ON public.events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = NEW.church_id
      AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    )
  );

CREATE POLICY "Events can be updated by creator, admins, or worship leaders"
  ON public.events
  FOR UPDATE
  USING (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = events.church_id
      AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    )
  );

-- Songs Table RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Songs are viewable by church members"
  ON public.songs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = songs.church_id
    )
  );

CREATE POLICY "Songs can be created by admins or worship leaders"
  ON public.songs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = NEW.church_id
      AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    )
  );

CREATE POLICY "Songs can be updated by creator, admins, or worship leaders"
  ON public.songs
  FOR UPDATE
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

-- Event Songs Table RLS
ALTER TABLE public.event_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event songs are viewable by church members"
  ON public.event_songs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      JOIN public.profiles ON profiles.church_id = events.church_id
      WHERE events.id = event_songs.event_id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Event songs can be added by event creators or worship leaders"
  ON public.event_songs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      JOIN public.profiles ON profiles.id = auth.uid()
      WHERE events.id = NEW.event_id
      AND events.church_id = profiles.church_id
      AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    )
  );

-- Prayer Requests Table RLS
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public prayer requests are viewable by church members"
  ON public.prayer_requests
  FOR SELECT
  USING (
    (NOT is_private AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = prayer_requests.church_id
    ))
    OR auth.uid() = user_id
  );

CREATE POLICY "Prayer requests can be created by authenticated users"
  ON public.prayer_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Prayer requests can be updated by their creator"
  ON public.prayer_requests
  FOR UPDATE
  USING (auth.uid() = user_id);
