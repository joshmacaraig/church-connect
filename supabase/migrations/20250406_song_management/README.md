# Song Management Feature - Supabase Migrations

This directory contains migration scripts to enhance the Supabase backend for the song management feature with chord transposition capabilities.

## Migration Files

1. `01_enhance_songs_table.sql`
   - Adds performance indexes to the songs table
   - Creates a song deletion policy
   - Sets up full-text search for song content
   - Adds helper functions for song queries

2. `02_enhance_song_storage.sql`
   - Enhances the storage system for song-related files
   - Creates specific policies for different types of song attachments
   - Adds a utility function for generating temporary access URLs

3. `03_song_tags_feature.sql`
   - Creates a tagging system for songs
   - Sets up junction tables and relationships
   - Implements RLS policies for tag management
   - Provides helper functions for finding songs by tag
   - Adds default tags for new churches

## How to Apply Migrations

Run these migrations in sequence using the Supabase CLI:

```bash
supabase db push --db-url=<DATABASE_URL>
```

Or manually apply them in the Supabase SQL Editor in the following order:
1. `01_enhance_songs_table.sql`
2. `02_enhance_song_storage.sql`
3. `03_song_tags_feature.sql`

## Security Considerations

These migrations maintain the security model where:
- Only church members can view songs from their church
- Only worship leaders and admins can create, update, or delete songs
- All access is controlled through Row Level Security (RLS) policies

## Database Changes

- Added indexes for performance optimization
- Created `song_tags` and `song_tag_assignments` tables
- Added utility functions for song search and filtering

## Storage Changes

- Enhanced policies for the `song-attachments` bucket
- Added subfolder-based permissions for different attachment types
- Set up deletion permissions for song files
