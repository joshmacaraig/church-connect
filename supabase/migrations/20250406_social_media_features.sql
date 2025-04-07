-- Migration script for adding social media features to Church Connect
-- Date: 2025-04-06

-- 1. Profile Extensions for Social Features
ALTER TABLE profiles 
  ADD COLUMN bio TEXT,
  ADD COLUMN cover_url TEXT,
  ADD COLUMN spiritual_gifts TEXT[],
  ADD COLUMN ministry_interests TEXT[];

-- 2. Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  post_type TEXT NOT NULL CHECK (post_type IN ('regular', 'announcement', 'testimony', 'prayer', 'event')),
  related_id UUID, -- For referencing prayer_requests, events, etc.
  is_pinned BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false
);

-- Add indexes for posts
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_church_id_idx ON posts(church_id);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX posts_post_type_idx ON posts(post_type);

-- 3. Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE -- For threaded comments
);

-- Add indexes for comments
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
CREATE INDEX comments_parent_idx ON comments(parent_comment_id);

-- 4. Create reactions table (likes, etc.)
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'pray', 'amen')),
  CONSTRAINT one_target_only CHECK (
    (post_id IS NULL AND comment_id IS NOT NULL) OR 
    (post_id IS NOT NULL AND comment_id IS NULL)
  ),
  CONSTRAINT unique_user_post_reaction UNIQUE (user_id, post_id, reaction_type),
  CONSTRAINT unique_user_comment_reaction UNIQUE (user_id, comment_id, reaction_type)
);

-- Add indexes for reactions
CREATE INDEX reactions_post_id_idx ON reactions(post_id);
CREATE INDEX reactions_comment_id_idx ON reactions(comment_id);
CREATE INDEX reactions_user_id_idx ON reactions(user_id);

-- 5. Create follows table
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Add indexes for follows
CREATE INDEX follows_follower_id_idx ON follows(follower_id);
CREATE INDEX follows_following_id_idx ON follows(following_id);

-- 6. Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'post_like', 'post_comment', 'comment_like', 'comment_reply', 
    'follow', 'mention', 'prayer_update', 'event_reminder', 'announcement'
  )),
  content TEXT NOT NULL,
  related_id UUID, -- Can reference posts, comments, etc.
  is_read BOOLEAN DEFAULT false
);

-- Add indexes for notifications
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_is_read_idx ON notifications(is_read) WHERE is_read = false;
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

-- 7. Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for groups
CREATE INDEX groups_church_id_idx ON groups(church_id);

-- 8. Create group_members junction table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

-- Add indexes for group_members
CREATE INDEX group_members_group_id_idx ON group_members(group_id);
CREATE INDEX group_members_user_id_idx ON group_members(user_id);

-- 9. Modify prayer_requests and events for posts integration
ALTER TABLE prayer_requests 
  ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE SET NULL;

ALTER TABLE events 
  ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE SET NULL;

-- 10. Create view for activity feed
CREATE OR REPLACE VIEW feed_items AS
SELECT 
  p.id,
  p.created_at,
  p.user_id,
  p.church_id,
  p.content,
  p.media_urls,
  p.post_type,
  p.related_id,
  'post' as item_type,
  pr.title as prayer_title,
  pr.is_anonymous as prayer_is_anonymous,
  e.title as event_title,
  e.start_time as event_time,
  u.email,
  prof.full_name,
  prof.avatar_url
FROM posts p
LEFT JOIN prayer_requests pr ON p.related_id = pr.id AND p.post_type = 'prayer'
LEFT JOIN events e ON p.related_id = e.id AND p.post_type = 'event'
LEFT JOIN auth.users u ON p.user_id = u.id
LEFT JOIN profiles prof ON p.user_id = prof.id;

-- 11. Create functions for post reactions
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

-- 12. Create function to create a notification when someone reacts to a post
CREATE OR REPLACE FUNCTION create_post_reaction_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if the user is reacting to their own post
  IF NEW.user_id = (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    RETURN NEW;
  END IF;
  
  -- Create notification for post owner
  INSERT INTO notifications (
    user_id,
    triggered_by,
    notification_type,
    content,
    related_id
  )
  VALUES (
    (SELECT user_id FROM posts WHERE id = NEW.post_id),
    NEW.user_id,
    'post_like',
    (SELECT CONCAT(
      (SELECT full_name FROM profiles WHERE id = NEW.user_id),
      ' reacted with ',
      NEW.reaction_type,
      ' to your post'
    )),
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Add trigger for post reaction notifications
CREATE TRIGGER post_reaction_notification_trigger
AFTER INSERT ON reactions
FOR EACH ROW
WHEN (NEW.post_id IS NOT NULL)
EXECUTE FUNCTION create_post_reaction_notification();

-- 14. Add RLS policies for social media tables
-- Posts policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY posts_select_policy ON posts
  FOR SELECT USING (
    auth.uid() = user_id OR
    (
      church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()) AND
      (NOT is_private OR auth.uid() IN (
        SELECT id FROM profiles WHERE church_id = posts.church_id AND user_role IN ('admin', 'worship_leader')
      ))
    )
  );

CREATE POLICY posts_insert_policy ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY posts_update_policy ON posts
  FOR UPDATE USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE church_id = posts.church_id AND user_role = 'admin'
    )
  );

CREATE POLICY posts_delete_policy ON posts
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE church_id = posts.church_id AND user_role = 'admin'
    )
  );

-- Comments policies
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY comments_select_policy ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = comments.post_id
      AND (
        p.user_id = auth.uid() OR
        (
          p.church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()) AND
          (NOT p.is_private OR auth.uid() IN (
            SELECT id FROM profiles WHERE church_id = p.church_id AND user_role IN ('admin', 'worship_leader')
          ))
        )
      )
    )
  );

CREATE POLICY comments_insert_policy ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY comments_update_policy ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY comments_delete_policy ON comments
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT p.user_id FROM posts p WHERE p.id = comments.post_id
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE church_id = (SELECT church_id FROM posts WHERE id = comments.post_id) 
      AND user_role = 'admin'
    )
  );

-- Reactions policies
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY reactions_select_policy ON reactions
  FOR SELECT USING (true);  -- Anyone can see reactions

CREATE POLICY reactions_insert_policy ON reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY reactions_delete_policy ON reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY follows_select_policy ON follows
  FOR SELECT USING (true);  -- Anyone can see follows

CREATE POLICY follows_insert_policy ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY follows_delete_policy ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Notifications policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_update_policy ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Groups policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY groups_select_policy ON groups
  FOR SELECT USING (
    church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()) AND
    (
      NOT is_private OR 
      auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = groups.id) OR
      auth.uid() IN (SELECT id FROM profiles WHERE church_id = groups.church_id AND user_role = 'admin')
    )
  );

CREATE POLICY groups_insert_policy ON groups
  FOR INSERT WITH CHECK (
    church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()) AND
    auth.uid() = created_by
  );

CREATE POLICY groups_update_policy ON groups
  FOR UPDATE USING (
    auth.uid() = created_by OR
    auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = groups.id AND is_admin = true) OR
    auth.uid() IN (SELECT id FROM profiles WHERE church_id = groups.church_id AND user_role = 'admin')
  );

CREATE POLICY groups_delete_policy ON groups
  FOR DELETE USING (
    auth.uid() = created_by OR
    auth.uid() IN (SELECT id FROM profiles WHERE church_id = groups.church_id AND user_role = 'admin')
  );

-- Group members policies
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_members_select_policy ON group_members
  FOR SELECT USING (true);  -- Anyone can see group members

CREATE POLICY group_members_insert_policy ON group_members
  FOR INSERT WITH CHECK (
    -- Group admins can add members
    (
      auth.uid() IN (
        SELECT user_id FROM group_members 
        WHERE group_id = group_members.group_id AND is_admin = true
      )
    ) OR
    -- Church admins can add members
    (
      auth.uid() IN (
        SELECT id FROM profiles
        WHERE church_id = (SELECT church_id FROM groups WHERE id = group_members.group_id)
        AND user_role = 'admin'
      )
    ) OR
    -- Users can add themselves to non-private groups
    (
      auth.uid() = user_id AND
      NOT EXISTS (
        SELECT 1 FROM groups
        WHERE id = group_members.group_id AND is_private = true
      )
    )
  );

CREATE POLICY group_members_update_policy ON group_members
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM group_members 
      WHERE group_id = group_members.group_id AND is_admin = true
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE church_id = (SELECT church_id FROM groups WHERE id = group_members.group_id)
      AND user_role = 'admin'
    )
  );

CREATE POLICY group_members_delete_policy ON group_members
  FOR DELETE USING (
    -- Members can remove themselves
    auth.uid() = user_id OR
    -- Group admins can remove members
    auth.uid() IN (
      SELECT user_id FROM group_members 
      WHERE group_id = group_members.group_id AND is_admin = true
    ) OR
    -- Church admins can remove members
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE church_id = (SELECT church_id FROM groups WHERE id = group_members.group_id)
      AND user_role = 'admin'
    )
  );

-- 15. Update the handle_new_user() function to include default social media fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    bio,
    spiritual_gifts,
    ministry_interests
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    '',
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[]
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Add update trigger for posts, comments, and other tables
CREATE TRIGGER update_posts_modtime
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_comments_modtime
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_groups_modtime
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
