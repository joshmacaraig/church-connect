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
