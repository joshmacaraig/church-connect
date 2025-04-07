-- Fix profiles lookup for posts
-- Date: 2025-04-06

-- Create a view that joins posts with profiles for efficient querying
CREATE OR REPLACE VIEW public.posts_with_profiles AS
SELECT 
  p.*,
  pr.full_name,
  pr.avatar_url,
  c.name as church_name
FROM 
  public.posts p
LEFT JOIN 
  public.profiles pr ON p.user_id = pr.id
LEFT JOIN
  public.churches c ON p.church_id = c.id;

-- Create a policy to allow access to the view
ALTER VIEW IF EXISTS public.posts_with_profiles OWNER TO postgres;
GRANT SELECT ON public.posts_with_profiles TO authenticated;

-- Create a function to get a user's full name by ID
CREATE OR REPLACE FUNCTION public.get_user_full_name(user_id_param UUID) 
RETURNS TEXT 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT full_name FROM public.profiles WHERE id = user_id_param
$$;

-- Create a function to get a user's avatar URL by ID
CREATE OR REPLACE FUNCTION public.get_user_avatar_url(user_id_param UUID) 
RETURNS TEXT 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT avatar_url FROM public.profiles WHERE id = user_id_param
$$;
