-- Fix infinite recursion in profiles RLS policy
-- Date: 2025-04-06

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles in their church" ON public.profiles;

-- 2. Create a new policy that avoids self-reference
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 3. Create a separate policy for viewing profiles in the same church
CREATE POLICY "Users can view profiles in their church"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.churches c
      JOIN public.profiles p ON p.church_id = c.id
      WHERE p.id = auth.uid() 
      AND c.id = profiles.church_id
    )
  );
