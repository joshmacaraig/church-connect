# Backend Setup Guide

This guide will walk you through setting up the Supabase backend for Church Connect.

## Prerequisites

- Supabase account (create one at [supabase.io](https://supabase.io))
- SQL knowledge for database customization

## Supabase Project Setup

1. **Create a new Supabase project**

   - Go to [app.supabase.io](https://app.supabase.io)
   - Click "New Project"
   - Enter a name for your project (e.g., "church-connect")
   - Set a secure database password
   - Choose a region closest to your target users
   - Click "Create new project"

2. **Get your project API keys**

   - Go to Project Settings > API
   - Copy the "URL" and "anon public key" 
   - Add these to your frontend .env file as specified in the frontend guide

## Database Schema Setup

Execute the following SQL in the Supabase SQL Editor to create the necessary tables:

### 1. Extension Setup

```sql
-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2. User Profiles Table

```sql
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

-- Set up Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

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
```

### 3. Churches Table

```sql
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

-- Set up Row Level Security
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- Create policies for churches
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
```

### 4. Worship Teams Table

```sql
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

-- Set up Row Level Security
ALTER TABLE public.worship_teams ENABLE ROW LEVEL SECURITY;

-- Create policies for teams
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
```

### 5. Team Members Table

```sql
-- Create a table for team members
CREATE TABLE public.team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  team_id UUID REFERENCES public.worship_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Set up Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team members
CREATE POLICY "Team members are viewable by church members"
  ON public.team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.worship_teams, public.profiles
      WHERE worship_teams.id = team_members.team_id
      AND profiles.id = auth.uid()
      AND profiles.church_id = worship_teams.church_id
    )
  );
```

### 6. Events Table (Calendar)

```sql
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

-- Set up Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
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
```

### 7. Songs Table

```sql
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

-- Set up Row Level Security
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Create policies for songs
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
```

### 8. Event Songs Junction Table

```sql
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

-- Set up Row Level Security
ALTER TABLE public.event_songs ENABLE ROW LEVEL SECURITY;

-- Create policies for event songs
CREATE POLICY "Event songs are viewable by church members"
  ON public.event_songs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events, public.profiles
      WHERE events.id = event_songs.event_id
      AND profiles.id = auth.uid()
      AND profiles.church_id = events.church_id
    )
  );
```

### 9. Prayer Requests Table

```sql
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

-- Set up Row Level Security
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for prayer requests
CREATE POLICY "Prayer requests are viewable by church members if not private"
  ON public.prayer_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.church_id = prayer_requests.church_id
    )
    AND (
      NOT is_private 
      OR 
      auth.uid() = user_id
      OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.church_id = prayer_requests.church_id
        AND profiles.user_role IN ('admin', 'worship_leader')
      )
    )
  );
```

## Storage Setup

1. **Create storage buckets**

   Navigate to Storage in the Supabase dashboard and create the following buckets:

   - `avatars` - For user profile pictures
   - `church-logos` - For church logos/images
   - `song-attachments` - For chord charts, sheet music, etc.

2. **Configure bucket policies**

   For each bucket, set up public access policies. Example for the avatars bucket:

   ```sql
   -- Allow users to upload their own avatar
   CREATE POLICY "Users can upload their own avatar"
   ON storage.objects
   FOR INSERT
   WITH CHECK (
     bucket_id = 'avatars' AND
     auth.uid() = SUBSTRING(name, 9, 36)::UUID
   );

   -- Allow users to update their own avatar
   CREATE POLICY "Users can update their own avatar"
   ON storage.objects
   FOR UPDATE
   USING (
     bucket_id = 'avatars' AND
     auth.uid() = SUBSTRING(name, 9, 36)::UUID
   );

   -- Allow public read access to avatars
   CREATE POLICY "Avatar images are publicly accessible"
   ON storage.objects
   FOR SELECT
   USING (bucket_id = 'avatars');
   ```

## Authentication Setup

1. **Configure auth providers**

   - Go to Authentication > Settings
   - Enable Email auth provider
   - Optionally, configure OAuth providers (Google, Facebook, etc.)

2. **Customize email templates**

   - Go to Authentication > Email Templates
   - Customize the confirmation and reset password emails
   - Add your app name and branding

3. **Set up email confirmations**

   - Go to Authentication > Settings
   - Enable "Confirm email" option

## Supabase Edge Functions (Optional)

For more complex backend logic, you can create Supabase Edge Functions:

1. **Install Supabase CLI**

   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase**

   ```bash
   supabase init
   ```

3. **Create a new function**

   ```bash
   supabase functions new notify-team-members
   ```

4. **Deploy your function**

   ```bash
   supabase functions deploy notify-team-members
   ```

## Security Considerations

1. **Row Level Security**
   - Ensure all tables have RLS enabled
   - Create appropriate policies for each action (SELECT, INSERT, UPDATE, DELETE)

2. **API Security**
   - Never expose your service_role key
   - Use the anon key for client-side requests

3. **Data Validation**
   - Add constraints to your tables (NOT NULL, CHECK constraints)
   - Implement additional validation in your frontend

## Monitoring and Maintenance

1. **Database Monitoring**
   - Check the SQL Editor > "Monitoring" tab regularly
   - Set up alerts for unusual activity

2. **Backups**
   - Supabase provides automatic backups
   - Consider scheduling additional point-in-time backups for critical data

## Troubleshooting

Common issues and solutions:

- **Permission errors**: Check your RLS policies
- **Auth issues**: Verify your auth settings and templates
- **Performance issues**: Add indexes to frequently queried columns

For more help, check the [Supabase documentation](https://supabase.io/docs).
