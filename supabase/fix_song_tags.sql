-- Create song_tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.song_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT, -- hexadecimal color code
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(church_id, name)
);

-- Add RLS to the song_tags table
ALTER TABLE public.song_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for the song_tags table (with proper error handling)
DO $$
BEGIN
  -- Check if policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'song_tags' AND policyname = 'Tags are viewable by church members'
  ) THEN
    -- Create policy for viewing tags
    CREATE POLICY "Tags are viewable by church members"
      ON public.song_tags
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.church_id = song_tags.church_id
        )
      );
  END IF;

  -- Check if policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'song_tags' AND policyname = 'Tags can be created by worship leaders or admins'
  ) THEN
    -- Create policy for creating tags
    CREATE POLICY "Tags can be created by worship leaders or admins"
      ON public.song_tags
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.church_id = NEW.church_id
          AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
        )
      );
  END IF;

  -- Check if policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'song_tags' AND policyname = 'Tags can be updated by worship leaders or admins'
  ) THEN
    -- Create policy for updating tags
    CREATE POLICY "Tags can be updated by worship leaders or admins"
      ON public.song_tags
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.church_id = song_tags.church_id
          AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
        )
      );
  END IF;

  -- Check if policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'song_tags' AND policyname = 'Tags can be deleted by worship leaders or admins'
  ) THEN
    -- Create policy for deleting tags
    CREATE POLICY "Tags can be deleted by worship leaders or admins"
      ON public.song_tags
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.church_id = song_tags.church_id
          AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
        )
      );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policies for song_tags: %', SQLERRM;
END
$$;

-- Create song_tag_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.song_tag_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.song_tags(id) ON DELETE CASCADE,
  UNIQUE(song_id, tag_id)
);

-- Add RLS to the song_tag_assignments table
ALTER TABLE public.song_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for the song_tag_assignments table (with proper error handling)
DO $$
BEGIN
  -- Check if policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'song_tag_assignments' AND policyname = 'Tag assignments are viewable by church members'
  ) THEN
    -- Create policy for viewing tag assignments
    CREATE POLICY "Tag assignments are viewable by church members"
      ON public.song_tag_assignments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.songs
          JOIN public.profiles ON profiles.church_id = songs.church_id
          WHERE songs.id = song_tag_assignments.song_id
          AND profiles.id = auth.uid()
        )
      );
  END IF;

  -- Check if policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'song_tag_assignments' AND policyname = 'Tags can be assigned by worship leaders or admins'
  ) THEN
    -- Create policy for assigning tags
    CREATE POLICY "Tags can be assigned by worship leaders or admins"
      ON public.song_tag_assignments
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.songs
          JOIN public.profiles ON profiles.id = auth.uid()
          WHERE songs.id = NEW.song_id
          AND songs.church_id = profiles.church_id
          AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
        )
      );
  END IF;

  -- Check if policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'song_tag_assignments' AND policyname = 'Tag assignments can be removed by worship leaders or admins'
  ) THEN
    -- Create policy for removing tag assignments
    CREATE POLICY "Tag assignments can be removed by worship leaders or admins"
      ON public.song_tag_assignments
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.songs
          JOIN public.profiles ON profiles.id = auth.uid()
          WHERE songs.id = song_tag_assignments.song_id
          AND songs.church_id = profiles.church_id
          AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
        )
      );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policies for song_tag_assignments: %', SQLERRM;
END
$$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_song_tag_assignments_song_id ON public.song_tag_assignments(song_id);
CREATE INDEX IF NOT EXISTS idx_song_tag_assignments_tag_id ON public.song_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_song_tags_church_id ON public.song_tags(church_id);

-- Create or replace the function to get songs by tag
CREATE OR REPLACE FUNCTION get_songs_by_tag(
  tag_name TEXT,
  church_id_param UUID
)
RETURNS SETOF public.songs
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT s.*
  FROM public.songs s
  JOIN public.song_tag_assignments sta ON s.id = sta.song_id
  JOIN public.song_tags st ON sta.tag_id = st.id
  WHERE 
    st.name = tag_name
    AND st.church_id = church_id_param
    AND s.church_id = church_id_param
  ORDER BY s.title ASC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_songs_by_tag TO authenticated;

-- Create or replace the function to add default tags
CREATE OR REPLACE FUNCTION add_default_song_tags()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default tags for the new church
  INSERT INTO public.song_tags (church_id, name, color, created_by)
  VALUES
    (NEW.id, 'Worship', '#FF5733', NEW.created_by),
    (NEW.id, 'Praise', '#33FF57', NEW.created_by),
    (NEW.id, 'Communion', '#3357FF', NEW.created_by),
    (NEW.id, 'Christmas', '#FF33A8', NEW.created_by),
    (NEW.id, 'Easter', '#33FFF5', NEW.created_by),
    (NEW.id, 'Fast', '#FFD433', NEW.created_by),
    (NEW.id, 'Slow', '#8B33FF', NEW.created_by),
    (NEW.id, 'Contemporary', '#FF8B33', NEW.created_by),
    (NEW.id, 'Traditional', '#338BFF', NEW.created_by);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding default tags: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for adding default tags if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'add_default_song_tags_trigger'
  ) THEN
    CREATE TRIGGER add_default_song_tags_trigger
      AFTER INSERT ON public.churches
      FOR EACH ROW EXECUTE FUNCTION add_default_song_tags();
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating trigger: %', SQLERRM;
END
$$;

-- Add default tags to existing churches that don't have tags yet
DO $$
BEGIN
  INSERT INTO public.song_tags (church_id, name, color, created_by)
  SELECT 
    c.id, 
    tag_name, 
    tag_color, 
    c.created_by
  FROM 
    public.churches c
    CROSS JOIN (
      VALUES 
        ('Worship', '#FF5733'),
        ('Praise', '#33FF57'),
        ('Communion', '#3357FF'),
        ('Christmas', '#FF33A8'),
        ('Easter', '#33FFF5'),
        ('Fast', '#FFD433'),
        ('Slow', '#8B33FF'),
        ('Contemporary', '#FF8B33'),
        ('Traditional', '#338BFF')
    ) AS tags(tag_name, tag_color)
  WHERE NOT EXISTS (
    SELECT 1 
    FROM public.song_tags st 
    WHERE st.church_id = c.id AND st.name = tags.tag_name
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding default tags to existing churches: %', SQLERRM;
END
$$;
