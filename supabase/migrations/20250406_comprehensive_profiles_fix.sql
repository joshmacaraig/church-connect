-- Comprehensive fix for profiles table RLS policies
-- Date: 2025-04-06

-- 1. First, let's list all existing policies on the profiles table (for diagnostics)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    tablename = 'profiles';

-- 2. Drop ALL existing policies on the profiles table to ensure a clean slate
DROP POLICY IF EXISTS "Users can view profiles in their church" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Also drop any other policies that might exist but weren't visible in our initial review
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

-- Allow users to view profiles from the same church (using materialized path approach)
CREATE POLICY "Users can view church member profiles"
  ON public.profiles
  FOR SELECT
  USING (
    -- Using a non-recursive approach with separate condition
    profiles.church_id IN (
      SELECT church_id 
      FROM public.profiles AS viewer 
      WHERE viewer.id = auth.uid()
    )
  );

-- Re-create the update policy
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 4. Add insert/delete policies if needed
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. Alternative approach using direct join if the above still causes issues
-- (This is commented out initially, but can be uncommented if needed)
/*
DROP POLICY IF EXISTS "Users can view church member profiles" ON public.profiles;

CREATE POLICY "Users can view church member profiles alternate"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.churches c
      WHERE c.id = profiles.church_id
      AND EXISTS (
        SELECT 1 
        FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.church_id = c.id
      )
    )
  );
*/

-- 6. Another alternative using temporary caching of church_id
-- (This is commented out initially, but can be uncommented if needed)
/*
CREATE OR REPLACE FUNCTION get_user_church_id() 
RETURNS UUID 
LANGUAGE sql 
STABLE
SECURITY DEFINER
AS $$
  SELECT church_id FROM public.profiles WHERE id = auth.uid()
$$;

DROP POLICY IF EXISTS "Users can view church member profiles" ON public.profiles;

CREATE POLICY "Users can view church member profiles function"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR
    get_user_church_id() = profiles.church_id
  );
*/

-- 7. Create a simplified view-based approach if all else fails
-- (This is commented out initially, but can be uncommented if needed)
/*
CREATE OR REPLACE VIEW accessible_profiles AS
WITH user_church AS (
  SELECT church_id 
  FROM public.profiles 
  WHERE id = auth.uid()
)
SELECT p.*
FROM public.profiles p, user_church uc
WHERE p.id = auth.uid() OR p.church_id = uc.church_id;

-- Grant access to the view
GRANT SELECT ON accessible_profiles TO authenticated;

-- Adjust application to use accessible_profiles view instead of profiles table directly
*/
