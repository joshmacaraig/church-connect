-- Alternative simpler fix for infinite recursion in profiles RLS policy
-- Date: 2025-04-06

-- This is a simpler alternative fix that may be easier to apply
-- You can use either this file or the 20250406_fix_profiles_rls.sql file

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles in their church" ON public.profiles;

-- 2. Create a new policy with a non-recursive approach
CREATE POLICY "Users can view profiles in their church"
  ON public.profiles
  FOR SELECT
  USING (
    -- Users can see their own profile
    auth.uid() = id
    OR
    -- Users can see profiles with the same church_id as their own profile
    (SELECT church_id FROM public.profiles WHERE id = auth.uid()) = profiles.church_id
  );
