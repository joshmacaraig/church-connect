-- Social Media Features - Essential Schema

-- 1. Add social profile fields
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE profiles 
      ADD COLUMN bio TEXT,
      ADD COLUMN cover_url TEXT,
      ADD COLUMN avatar_url TEXT,  -- Add this if it doesn't exist
      ADD COLUMN spiritual_gifts TEXT[],
      ADD COLUMN ministry_interests TEXT[];
  EXCEPTION
    WHEN duplicate_column THEN 
      RAISE NOTICE 'columns already exist in profiles table';
  END;
END $$;

-- 2. Create posts table (core of social functionality)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  post_type TEXT NOT NULL DEFAULT 'regular',
  related_id UUID,
  is_pinned BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false
);

-- 3. Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE
);

-- 4. Create reactions table
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  CONSTRAINT one_target_only CHECK (
    (post_id IS NULL AND comment_id IS NOT NULL) OR 
    (post_id IS NOT NULL AND comment_id IS NULL)
  ),
  UNIQUE(user_id, post_id, reaction_type),
  UNIQUE(user_id, comment_id, reaction_type)
);

-- 5. Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  UNIQUE(follower_id, following_id)
);

-- 6. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  content TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false
);

-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS posts_church_id_idx ON public.posts(church_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_post_type_idx ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS reactions_post_id_idx ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS reactions_user_id_idx ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);

-- 8. Set up RLS policies
ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- Basic policies for posts
DROP POLICY IF EXISTS posts_select_policy ON public.posts;
CREATE POLICY posts_select_policy ON public.posts
  FOR SELECT USING (true);  -- Start with simple policy: everyone can see posts

DROP POLICY IF EXISTS posts_insert_policy ON public.posts;
CREATE POLICY posts_insert_policy ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Basic policies for comments
DROP POLICY IF EXISTS comments_select_policy ON public.comments;
CREATE POLICY comments_select_policy ON public.comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS comments_insert_policy ON public.comments;
CREATE POLICY comments_insert_policy ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Basic policies for reactions
DROP POLICY IF EXISTS reactions_select_policy ON public.reactions;
CREATE POLICY reactions_select_policy ON public.reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS reactions_insert_policy ON public.reactions;
CREATE POLICY reactions_insert_policy ON public.reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Basic policies for follows
DROP POLICY IF EXISTS follows_select_policy ON public.follows;
CREATE POLICY follows_select_policy ON public.follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS follows_insert_policy ON public.follows;
CREATE POLICY follows_insert_policy ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Basic policies for notifications
DROP POLICY IF EXISTS notifications_select_policy ON public.notifications;
CREATE POLICY notifications_select_policy ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- 9. Update trigger function for posts
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_posts_modtime ON public.posts;
CREATE TRIGGER update_posts_modtime
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_comments_modtime ON public.comments;
CREATE TRIGGER update_comments_modtime
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 10. Create toggle_reaction function
CREATE OR REPLACE FUNCTION toggle_post_reaction(
  post_id_param UUID,
  user_id_param UUID,
  reaction_type_param TEXT
) RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_reaction UUID;
BEGIN
  -- Check if reaction exists
  SELECT id INTO existing_reaction 
  FROM reactions 
  WHERE post_id = post_id_param 
    AND user_id = user_id_param
    AND reaction_type = reaction_type_param;
    
  -- If exists, remove it and return false
  IF existing_reaction IS NOT NULL THEN
    DELETE FROM reactions WHERE id = existing_reaction;
    RETURN false;
  -- If doesn't exist, create it and return true
  ELSE
    INSERT INTO reactions (post_id, user_id, reaction_type)
    VALUES (post_id_param, user_id_param, reaction_type_param);
    RETURN true;
  END IF;
END;
$$;
