-- Create service_team_members table
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

-- Add updated_at trigger
CREATE TRIGGER update_service_team_members_modtime
  BEFORE UPDATE ON public.service_team_members
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Add RLS policies
ALTER TABLE public.service_team_members ENABLE ROW LEVEL SECURITY;

-- View policy: Church members can view team assignments for their church's events
CREATE POLICY "Church members can view team assignments" ON public.service_team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN profiles p ON p.church_id = e.church_id
      WHERE e.id = service_team_members.event_id
      AND p.id = auth.uid()
    )
  );

-- Insert policy: Team leaders and church admins can add members
CREATE POLICY "Team leaders and admins can add members" ON public.service_team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN profiles p ON p.id = auth.uid()
      WHERE e.id = service_team_members.event_id
      AND (
        -- Church admin
        (p.user_role = 'admin' AND p.church_id = e.church_id) OR
        -- Team leader
        (EXISTS (
          SELECT 1 FROM worship_teams t
          JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = auth.uid()
          WHERE t.id = e.team_id AND tm.role LIKE '%leader%'
        )) OR
        -- Event creator
        (e.created_by = auth.uid())
      )
    )
  );

-- Update policy: Team leaders and church admins can update assignments
CREATE POLICY "Team leaders and admins can update members" ON public.service_team_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN profiles p ON p.id = auth.uid()
      WHERE e.id = service_team_members.event_id
      AND (
        -- Church admin
        (p.user_role = 'admin' AND p.church_id = e.church_id) OR
        -- Team leader
        (EXISTS (
          SELECT 1 FROM worship_teams t
          JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = auth.uid()
          WHERE t.id = e.team_id AND tm.role LIKE '%leader%'
        )) OR
        -- Event creator
        (e.created_by = auth.uid()) OR
        -- Self update for confirmation
        (service_team_members.user_id = auth.uid() AND 
         OLD.is_confirmed IS DISTINCT FROM NEW.is_confirmed)
      )
    )
  );

-- Delete policy: Team leaders and church admins can remove assignments
CREATE POLICY "Team leaders and admins can delete members" ON public.service_team_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN profiles p ON p.id = auth.uid()
      WHERE e.id = service_team_members.event_id
      AND (
        -- Church admin
        (p.user_role = 'admin' AND p.church_id = e.church_id) OR
        -- Team leader
        (EXISTS (
          SELECT 1 FROM worship_teams t
          JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = auth.uid()
          WHERE t.id = e.team_id AND tm.role LIKE '%leader%'
        )) OR
        -- Event creator
        (e.created_by = auth.uid())
      )
    )
  );

-- Create index for better performance
CREATE INDEX service_team_members_event_id_idx ON public.service_team_members(event_id);
CREATE INDEX service_team_members_user_id_idx ON public.service_team_members(user_id);
