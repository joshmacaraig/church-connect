# Supabase Backend Setup Guide

This guide provides comprehensive instructions for setting up the Supabase backend for the Church Connect application. Follow these steps to create and configure your database, authentication, and storage.

## Table of Contents

1. [Creating a Supabase Account and Project](#1-creating-a-supabase-account-and-project)
2. [Setting Up Authentication](#2-setting-up-authentication)
3. [Database Schema Setup](#3-database-schema-setup)
4. [Row Level Security (RLS) Policies](#4-row-level-security-rls-policies)
5. [Storage Configuration](#5-storage-configuration)
6. [Webhook and Function Setup](#6-webhook-and-function-setup)
7. [Testing Your Backend](#7-testing-your-backend)
8. [Connecting to Your Frontend](#8-connecting-to-your-frontend)

## 1. Creating a Supabase Account and Project

1. Visit [supabase.com](https://supabase.com) and sign up for an account (or log in if you already have one)
2. From the Supabase dashboard, click **New Project**
3. Enter the following details:
   - **Name**: Church Connect (or your preferred name)
   - **Database Password**: Create a secure password and save it
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Start with the free tier for development
4. Click **Create new project** and wait for setup to complete (this may take a few minutes)
5. Once created, you'll be taken to your project dashboard

## 2. Setting Up Authentication

1. In your Supabase project dashboard, navigate to **Authentication** → **Settings**
2. Under **Email Auth**, ensure it's enabled and configure:
   - Enable **Confirm email**
   - Set a custom redirect URL: `https://yourdomain.com/auth/callback` (use `http://localhost:3000/auth/callback` for local development)
   - Configure password constraints as needed

3. Customize email templates:
   - Go to **Authentication** → **Email Templates**
   - Edit the templates for Confirmation and Recovery emails
   - Add your app name and branding

4. (Optional) Set up OAuth providers:
   - Navigate to **Authentication** → **Providers**
   - Enable and configure Google, Facebook, or other providers as needed

## 3. Database Schema Setup

### Extensions Setup

First, enable required extensions in the SQL Editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### User Profiles Table

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

### Churches Table

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
```

### Worship Teams Table

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
```

### Team Members Table

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
```

### Events Table

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
```

### Songs Table

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
```

### Event Songs Junction Table

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
```

### Prayer Requests Table

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
```

## 4. Row Level Security (RLS) Policies

Enable Row Level Security (RLS) for each table to control data access:

### Profiles Table RLS

```sql
-- Enable RLS
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
```

### Churches Table RLS

```sql
-- Enable RLS
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
```

### Worship Teams Table RLS

```sql
-- Enable RLS
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
```

### Apply similar policies to other tables

Follow the same pattern to create policies for the remaining tables:
- `team_members`
- `events`
- `songs`
- `event_songs`
- `prayer_requests`

## 5. Storage Configuration

### Create Storage Buckets

1. In the Supabase dashboard, navigate to **Storage**
2. Create the following buckets:
   - `avatars` - For user profile pictures
   - `church-logos` - For church logos and images
   - `song-attachments` - For song sheet music and files

### Configure Storage Bucket Policies

For the avatars bucket:

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

For the church-logos bucket:

```sql
-- Allow church admins to upload church logos
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

-- Allow public read access to church logos
CREATE POLICY "Church logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'church-logos');
```

For the song-attachments bucket:

```sql
-- Allow worship leaders and admins to upload song attachments
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

-- Allow church members to view song attachments
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
```

## 6. Webhook and Function Setup

Create a function to update event timestamps:

```sql
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

-- Add similar triggers for other tables with updated_at columns
```

## 7. Testing Your Backend

### Test Authentication

1. In the Supabase dashboard, go to **Authentication** → **Users**
2. Click **New User** to create a test user
3. Fill in the email and password and create the user
4. Verify that a profile record was automatically created in the profiles table

### Test Database Access

1. Go to **Table Editor** and check that all tables are created
2. Try inserting a test record in the churches table
3. Insert related records in other tables to test relationships
4. Test RLS policies by signing in as different users and attempting to access or modify data

## 8. Connecting to Your Frontend

Get your Supabase URL and anon key:

1. In the Supabase dashboard, go to **Settings** → **API**
2. Copy the **URL** and **anon public** key
3. Add these to your frontend `.env` file:

```
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Use these values to initialize the Supabase client in your frontend app

## Troubleshooting

### Common Issues

#### Authentication Problems

If email confirmations aren't working:
- Check that the email provider is properly configured in Supabase
- Verify that the redirect URL is correct
- During development, you may need to disable email confirmation

#### RLS Policy Restrictions

If you're getting permission denied errors:
- Check that your RLS policies are correctly written
- Verify that the user has the required role
- For debugging, temporarily disable RLS on the table

#### Database Schema Errors

If you're encountering foreign key constraint failures:
- Ensure you're creating tables in the correct order
- Check that referenced records exist before creating dependent records

## Next Steps

After completing the backend setup, proceed to:
1. Connect your frontend to Supabase
2. Implement authentication flows
3. Create the UI components for each feature
4. Test the complete application

For more information, refer to the [Supabase documentation](https://supabase.io/docs) or ask your Claude assistant for help.
