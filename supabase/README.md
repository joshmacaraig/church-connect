# Supabase Setup for Church Connect

## Setting Up Social Media Features

To fix the "Error loading posts: Could not find a relationship between 'posts' and 'user_id' in the schema cache" error, you need to run the database migrations to set up the required tables.

### Steps to Set Up the Database

1. **Open your Supabase project dashboard**
   - Log in to your Supabase account
   - Navigate to your Church Connect project

2. **Access the SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New Query" to create a new SQL query

3. **Run the Social Media Migration Script**
   - Copy the contents of the `setup_social_features.sql` file from the `supabase/migrations` directory
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

4. **Verify the Tables Were Created**
   - Go to the "Table Editor" in the left sidebar
   - You should now see the following tables:
     - posts
     - comments
     - reactions
     - follows
     - notifications

5. **Create Storage Buckets**
   - Click on "Storage" in the left sidebar
   - Click "New Bucket"
   - Create a bucket called "media" for post attachments
   - Create a bucket called "avatars" for profile pictures if it doesn't exist
   - Set the privacy settings to "Authenticated Users" for both buckets

6. **Create RLS Policies for Storage**
   - For each bucket, click on "Policies"
   - Add policies to allow authenticated users to upload and view files

## Common Issues and Solutions

### Missing Foreign Key Relationships

If you see errors about missing relationships, you may need to manually add the relationships:

1. Go to the "Table Editor"
2. Select the table that has the issue (e.g., posts)
3. Go to the "Foreign Keys" tab
4. Add any missing relationships:
   - For `posts.user_id`, create a foreign key to `auth.users.id`
   - For `posts.church_id`, create a foreign key to `churches.id`

### Storage Permission Issues

If you have issues uploading files:

1. Go to the "Storage" section
2. Select the bucket
3. Click on "Policies"
4. Create policies that allow authenticated users to:
   - SELECT (view) files
   - INSERT (upload) files
   - UPDATE files (if needed)
   - DELETE files (if needed)

Example policy for uploads:
```sql
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'media' AND auth.uid() = owner);
```

## Database Schema Overview

The social media features include the following tables:

- **posts**: Core content sharing functionality
- **comments**: User comments on posts
- **reactions**: Likes, prayers, and other reactions
- **follows**: User following relationships
- **notifications**: System notifications for user activities

For detailed table structures, refer to the SQL migration files in the `supabase/migrations` directory.
