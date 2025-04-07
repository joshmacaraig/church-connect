-- Combined SQL for Church Connect Supabase Setup

-- ==========================================
-- File: 00_setup_functions.sql
-- ==========================================

-- Create a function that allows executing SQL
-- Note: This is only for setup purposes and should be used carefully
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- ==========================================
-- File: 01_initial_schema.sql
-- ==========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a table for user profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  full_name TEXT,
  avatar_url TEXT,
  church_id UUID,
  user_role TEXT CHECK (user_role IN ('admin', 'worship_leader', 'member')),

  PRIMARY KEY (id)
);

-- Create a trigger to create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a table for churches
CREATE TABLE public.churches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create a table for worship teams
CREATE TABLE public.worship_teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create a table for team members
CREATE TABLE public.team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  team_id UUID REFERENCES public.worship_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Create a table for events
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.worship_teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  event_type TEXT CHECK (event_type IN ('service', 'practice', 'meeting', 'other')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create a table for songs
CREATE TABLE public.songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  default_key TEXT,
  tempo INTEGER,
  lyrics TEXT,
  chords TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create a table for event songs
CREATE TABLE public.event_songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  song_order INTEGER NOT NULL,
  key TEXT,
  notes TEXT,
  UNIQUE(event_id, song_order)
);

-- Create a table for prayer requests
CREATE TABLE public.prayer_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false
);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_churches_modtime
  BEFORE UPDATE ON public.churches
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_worship_teams_modtime
  BEFORE UPDATE ON public.worship_teams
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_events_modtime
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_songs_modtime
  BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_prayer_requests_modtime
  BEFORE UPDATE ON public.prayer_requests
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ==========================================
-- File: 02_security_policies.sql
-- ==========================================

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

-- ==========================================
-- File: 03_storage_setup.sql
-- ==========================================

-- Create and configure storage buckets for the application

-- For the avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() = SUBSTRING(name, 9, 36)::UUID
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid() = SUBSTRING(name, 9, 36)::UUID
);

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- For the church-logos bucket
CREATE POLICY "Church admins can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'church-logos' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_role = 'admin'
    AND profiles.church_id::text = SPLIT_PART(name, '/', 1)
  )
);

CREATE POLICY "Church logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'church-logos');

-- For the song-attachments bucket
CREATE POLICY "Worship leaders can upload song attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'song-attachments' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    AND profiles.church_id::text = SPLIT_PART(name, '/', 1)
  )
);

CREATE POLICY "Church members can view song attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'song-attachments' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.church_id::text = SPLIT_PART(name, '/', 1)
  )
);
