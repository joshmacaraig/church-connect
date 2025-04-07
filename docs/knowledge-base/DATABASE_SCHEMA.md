# Church Connect - Database Schema

## Overview

This document outlines the database schema for the Church Connect application. The database is implemented using PostgreSQL through Supabase, with tables designed to support the core functionality of the application including authentication, church organization, worship team management, event planning, and prayer requests.

## Entity Relationship Diagram

```
+-------------+       +------------+       +--------------+
|   profiles  |------>|  churches  |<------|worship_teams |
+-------------+       +------------+       +--------------+
       |                    ^                     ^
       |                    |                     |
       v                    |                     v
+-------------+       +------------+       +--------------+
|    users    |       |   events   |------>| team_members |
+-------------+       +------------+       +--------------+
                           |
                           v
                     +------------+       +--------------+
                     |event_songs |<------|    songs     |
                     +------------+       +--------------+
                           
+-------------+
|prayer_      |
|requests     |
+-------------+
```

## Tables

### profiles

Extends the native Supabase auth.users table to store additional user information.

| Column      | Type                 | Description                                   |
|-------------|----------------------|-----------------------------------------------|
| id          | UUID (PK)            | Foreign key to auth.users(id)                 |
| updated_at  | TIMESTAMP            | Last update timestamp                         |
| full_name   | TEXT                 | User's full name                              |
| avatar_url  | TEXT                 | URL to user's profile image                   |
| church_id   | UUID                 | Foreign key to churches(id)                   |
| user_role   | TEXT                 | Role: 'admin', 'worship_leader', or 'member'  |

Constraints:
- Primary key: id
- Foreign key: id references auth.users(id) ON DELETE CASCADE
- Check constraint: user_role IN ('admin', 'worship_leader', 'member')

### churches

Stores information about church organizations.

| Column      | Type                 | Description                                   |
|-------------|----------------------|-----------------------------------------------|
| id          | UUID (PK)            | Primary key                                   |
| created_at  | TIMESTAMP            | Creation timestamp                            |
| updated_at  | TIMESTAMP            | Last update timestamp                         |
| name        | TEXT (NOT NULL)      | Church name                                   |
| location    | TEXT                 | Physical location                             |
| description | TEXT                 | Description of the church                     |
| logo_url    | TEXT                 | URL to church logo                            |
| created_by  | UUID                 | Foreign key to auth.users(id)                 |

Constraints:
- Primary key: id
- Foreign key: created_by references auth.users(id) ON DELETE SET NULL

### worship_teams

Represents worship teams within a church.

| Column      | Type                 | Description                                   |
|-------------|----------------------|-----------------------------------------------|
| id          | UUID (PK)            | Primary key                                   |
| created_at  | TIMESTAMP            | Creation timestamp                            |
| updated_at  | TIMESTAMP            | Last update timestamp                         |
| church_id   | UUID (NOT NULL)      | Foreign key to churches(id)                   |
| name        | TEXT (NOT NULL)      | Team name                                     |
| description | TEXT                 | Team description                              |
| created_by  | UUID                 | Foreign key to auth.users(id)                 |

Constraints:
- Primary key: id
- Foreign key: church_id references churches(id) ON DELETE CASCADE
- Foreign key: created_by references auth.users(id) ON DELETE SET NULL

### team_members

Junction table connecting users to worship teams.

| Column      | Type                 | Description                                   |
|-------------|----------------------|-----------------------------------------------|
| id          | UUID (PK)            | Primary key                                   |
| created_at  | TIMESTAMP            | Creation timestamp                            |
| team_id     | UUID (NOT NULL)      | Foreign key to worship_teams(id)              |
| user_id     | UUID (NOT NULL)      | Foreign key to auth.users(id)                 |
| role        | TEXT (NOT NULL)      | Role in the team (e.g., 'vocalist', 'guitar') |

Constraints:
- Primary key: id
- Foreign key: team_id references worship_teams(id) ON DELETE CASCADE
- Foreign key: user_id references auth.users(id) ON DELETE CASCADE
- Unique constraint: (team_id, user_id)

### events

Stores information about church events, services, and meetings.

| Column      | Type                 | Description                                   |
|-------------|----------------------|-----------------------------------------------|
| id          | UUID (PK)            | Primary key                                   |
| created_at  | TIMESTAMP            | Creation timestamp                            |
| updated_at  | TIMESTAMP            | Last update timestamp                         |
| church_id   | UUID (NOT NULL)      | Foreign key to churches(id)                   |
| team_id     | UUID                 | Foreign key to worship_teams(id)              |
| title       | TEXT (NOT NULL)      | Event title                                   |
| description | TEXT                 | Event description                             |
| start_time  | TIMESTAMP (NOT NULL) | Start time                                    |
| end_time    | TIMESTAMP (NOT NULL) | End time                                      |
| location    | TEXT                 | Event location                                |
| event_type  | TEXT                 | Type: 'service', 'practice', 'meeting', etc.  |
| created_by  | UUID                 | Foreign key to auth.users(id)                 |

Constraints:
- Primary key: id
- Foreign key: church_id references churches(id) ON DELETE CASCADE
- Foreign key: team_id references worship_teams(id) ON DELETE SET NULL
- Foreign key: created_by references auth.users(id) ON DELETE SET NULL
- Check constraint: event_type IN ('service', 'practice', 'meeting', 'other')

### songs

Stores worship songs used by churches.

| Column      | Type                 | Description                                   |
|-------------|----------------------|-----------------------------------------------|
| id          | UUID (PK)            | Primary key                                   |
| created_at  | TIMESTAMP            | Creation timestamp                            |
| updated_at  | TIMESTAMP            | Last update timestamp                         |
| church_id   | UUID (NOT NULL)      | Foreign key to churches(id)                   |
| title       | TEXT (NOT NULL)      | Song title                                    |
| artist      | TEXT                 | Song artist/composer                          |
| default_key | TEXT                 | Default musical key                           |
| tempo       | INTEGER              | Song tempo (BPM)                              |
| lyrics      | TEXT                 | Song lyrics                                   |
| chords      | TEXT                 | Chord chart                                   |
| notes       | TEXT                 | Additional notes                              |
| created_by  | UUID                 | Foreign key to auth.users(id)                 |

Constraints:
- Primary key: id
- Foreign key: church_id references churches(id) ON DELETE CASCADE
- Foreign key: created_by references auth.users(id) ON DELETE SET NULL

### event_songs

Junction table connecting songs to events, used for service planning.

| Column      | Type                 | Description                                   |
|-------------|----------------------|-----------------------------------------------|
| id          | UUID (PK)            | Primary key                                   |
| created_at  | TIMESTAMP            | Creation timestamp                            |
| event_id    | UUID (NOT NULL)      | Foreign key to events(id)                     |
| song_id     | UUID (NOT NULL)      | Foreign key to songs(id)                      |
| song_order  | INTEGER (NOT NULL)   | Order in the service                          |
| key         | TEXT                 | Key for this specific performance             |
| notes       | TEXT                 | Performance notes                             |

Constraints:
- Primary key: id
- Foreign key: event_id references events(id) ON DELETE CASCADE
- Foreign key: song_id references songs(id) ON DELETE CASCADE
- Unique constraint: (event_id, song_order)

### prayer_requests

Stores prayer requests submitted by church members.

| Column      | Type                 | Description                                   |
|-------------|----------------------|-----------------------------------------------|
| id          | UUID (PK)            | Primary key                                   |
| created_at  | TIMESTAMP            | Creation timestamp                            |
| updated_at  | TIMESTAMP            | Last update timestamp                         |
| user_id     | UUID (NOT NULL)      | Foreign key to auth.users(id)                 |
| church_id   | UUID (NOT NULL)      | Foreign key to churches(id)                   |
| title       | TEXT (NOT NULL)      | Prayer request title                          |
| description | TEXT                 | Detailed description                          |
| is_anonymous| BOOLEAN              | Whether to hide the requester's identity      |
| is_private  | BOOLEAN              | Whether visible only to church leadership     |

Constraints:
- Primary key: id
- Foreign key: user_id references auth.users(id) ON DELETE CASCADE
- Foreign key: church_id references churches(id) ON DELETE CASCADE

## Row Level Security (RLS) Policies

The database implements Row Level Security (RLS) policies to ensure that users can only access data they're authorized to see:

### Profiles

- Users can view profiles in their church
- Users can update only their own profile

### Churches

- Churches are viewable by all authenticated users
- Churches can be created by any authenticated user
- Churches can be updated only by their creator or church admins

### Worship Teams

- Teams are viewable by members of the same church
- Teams can be created by church admins or worship leaders
- Teams can be updated by church admins or worship leaders

### Team Members

- Team member records are viewable by members of the same church
- Team members can be added/removed by team leaders or church admins

### Events

- Events are viewable by members of the associated church
- Events can be created by church admins or worship leaders
- Events can be updated by their creator, assigned team leader, or church admin

### Songs

- Songs are viewable by members of the associated church
- Songs can be added by worship leaders or church admins
- Songs can be modified by worship leaders or church admins

### Event Songs

- Event song assignments are viewable by members of the associated church
- Assignments can be managed by event creators, worship leaders, or church admins

### Prayer Requests

- Prayer requests are viewable by church members if not private
- Private prayer requests are viewable only by church leadership
- Prayer requests can be created by any authenticated church member
- Prayer requests can be updated only by their creator or church admin

## Indexes

The following indexes improve query performance:

- `profiles_church_id_idx`: On profiles(church_id)
- `events_church_id_idx`: On events(church_id)
- `events_start_time_idx`: On events(start_time)
- `events_team_id_idx`: On events(team_id)
- `prayer_requests_church_id_idx`: On prayer_requests(church_id)
- `songs_church_id_idx`: On songs(church_id)

## Functions and Triggers

### handle_new_user()

Trigger function that automatically creates a profile entry when a new user signs up.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### update_modified_column()

Trigger function that automatically updates the updated_at timestamp when a record is modified.

```sql
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for each table with updated_at column
CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_churches_modtime
  BEFORE UPDATE ON public.churches
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
  
-- Similar triggers for other tables
```

## Storage Buckets

In addition to the database tables, the application uses Supabase Storage for file storage:

- `avatars`: User profile pictures
- `church-logos`: Church logo images
- `song-attachments`: Sheet music, chord charts, and other song-related files

These buckets have their own security policies to control access and management rights.

## Database Migrations

The database schema can be initialized using SQL scripts in the `/supabase` directory of the project. These scripts create all necessary tables, functions, triggers, and RLS policies.

## Data Relationships and Access Patterns

### Church Membership

- Users are associated with a church via their profile's `church_id`
- This association determines which church data they can access
- Church admins have elevated permissions for their church's data

### Team Membership

- Users are associated with worship teams via the `team_members` table
- Team membership determines which team-specific data they can access
- Team roles (stored in `team_members.role`) can be used for UI customization

### Event Planning

- Events are associated with a church and optionally a worship team
- Songs are added to events via the `event_songs` table
- The `song_order` field determines the sequence of songs in a service

### Prayer Chain

- Prayer requests are associated with a church and a user
- Privacy flags control visibility to other church members
- Church leaders can view all prayer requests, including private ones

## Performance Considerations

- Indexes are added to frequently queried fields
- RLS policies may impact query performance and should be optimized
- Large text fields (lyrics, descriptions) could benefit from compression
- Consider pagination for queries returning large result sets (e.g., songs library)

## Related Documentation

- [Supabase Setup Guide](../SUPABASE_SETUP.md)
- [Authentication System](./AUTHENTICATION_SYSTEM.md)
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
