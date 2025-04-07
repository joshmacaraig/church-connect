-- Create and configure storage buckets for the application

-- For the avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() = SUBSTRING(name, 9, 36)::UUID
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid() = SUBSTRING(name, 9, 36)::UUID
);

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- For the church-logos bucket
CREATE POLICY "Church admins can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'church-logos' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_role = 'admin'
    AND profiles.church_id::text = SPLIT_PART(name, '/', 1)
  )
);

CREATE POLICY "Church logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'church-logos');

-- For the song-attachments bucket
CREATE POLICY "Worship leaders can upload song attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'song-attachments' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.user_role = 'admin' OR profiles.user_role = 'worship_leader')
    AND profiles.church_id::text = SPLIT_PART(name, '/', 1)
  )
);

CREATE POLICY "Church members can view song attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'song-attachments' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.church_id::text = SPLIT_PART(name, '/', 1)
  )
);
