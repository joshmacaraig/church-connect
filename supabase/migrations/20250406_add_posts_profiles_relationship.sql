-- Add relationship between posts and profiles
-- Date: 2025-04-06

-- Create a view that joins posts with profiles data
CREATE OR REPLACE VIEW public.posts_with_authors AS
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

-- Grant access to the view for authenticated users
GRANT SELECT ON public.posts_with_authors TO authenticated;

-- Create function to get post author's name
CREATE OR REPLACE FUNCTION public.get_post_author_name(post_id_param UUID) 
RETURNS TEXT 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pr.full_name 
  FROM public.posts p
  JOIN public.profiles pr ON p.user_id = pr.id
  WHERE p.id = post_id_param
$$;
