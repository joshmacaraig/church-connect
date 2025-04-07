-- Final fix for profiles table RLS infinite recursion issue
-- Date: 2025-04-06

-- 1. Create a function to retrieve a user's church_id outside of the policy context
CREATE OR REPLACE FUNCTION public.get_user_church_id() 
RETURNS UUID 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT church_id FROM public.profiles WHERE id = auth.uid()
$$;

-- 2. Drop all existing policies on the profiles table to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.policyname);
    END LOOP;
END $$;

-- 3. Create new non-recursive policies

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to view profiles from the same church using the function
CREATE POLICY "Users can view church member profiles"
  ON public.profiles
  FOR SELECT
  USING (
    -- Using a function to break the recursive dependency
    public.get_user_church_id() = profiles.church_id
  );

-- Re-create the update policy
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Add insert policy
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
