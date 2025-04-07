-- Update the service_team_members query to use direct joins
-- This file is a fix for the relationship issue with service_team_members

-- First, let's make sure the table exists
CREATE TABLE IF NOT EXISTS public.service_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  notes TEXT,
  is_confirmed BOOLEAN DEFAULT false,
  
  -- Ensure each user is only assigned once per event
  CONSTRAINT service_team_members_event_user_unique UNIQUE (event_id, user_id)
);

-- For now, we'll comment out the team member section in the UI until this gets applied
-- This file should be executed against your Supabase database
