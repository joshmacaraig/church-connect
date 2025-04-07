# Church Connect - API Documentation

## Overview

Church Connect uses Supabase as its backend, which provides a RESTful API for database access. This document outlines the common API patterns and endpoints used throughout the application.

## Authentication API

### Sign Up

```javascript
const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Registers a new user
- **Parameters**:
  - `email`: User's email address
  - `password`: User's chosen password
  - `metadata`: Additional user data (full name, etc.)
- **Returns**: User data including UUID
- **Notes**: 
  - Automatically creates profile record via trigger
  - Sends confirmation email if enabled

### Sign In

```javascript
const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Authenticates an existing user
- **Parameters**:
  - `email`: User's email address
  - `password`: User's password
- **Returns**: Session data including JWT
- **Notes**: JWT is automatically used for subsequent requests

### Sign Out

```javascript
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
```

- **Purpose**: Ends the user's session
- **Returns**: None
- **Notes**: Clears JWT from local storage

### Reset Password

```javascript
const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) throw error;
};
```

- **Purpose**: Initiates password reset process
- **Parameters**:
  - `email`: User's email address
- **Returns**: None
- **Notes**: Sends email with reset link

### Update User

```javascript
const updateUser = async (updates) => {
  const { data, error } = await supabase.auth.updateUser(updates);
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Updates user data
- **Parameters**:
  - `updates`: Object containing fields to update (email, password, etc.)
- **Returns**: Updated user data
- **Notes**: Can be used for email or password change

## Profiles API

### Get Current Profile

```javascript
const getCurrentProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) throw error;
  return data;
};
```

- **Purpose**: Retrieves the current user's profile
- **Returns**: Profile data including church ID and role
- **Notes**: 
  - Uses the current session's user ID
  - Returns a single record

### Update Profile

```javascript
const updateProfile = async (profileData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: profileData.fullName,
      avatar_url: profileData.avatarUrl,
      updated_at: new Date()
    })
    .eq('id', user.id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Updates the user's profile
- **Parameters**:
  - `profileData`: Object containing fields to update
- **Returns**: Updated profile data
- **Notes**: 
  - Separate from auth user update
  - Can update profile-specific fields

### Set User Church

```javascript
const setUserChurch = async (churchId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      church_id: churchId,
      updated_at: new Date()
    })
    .eq('id', user.id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Associates user with a church
- **Parameters**:
  - `churchId`: UUID of the church
- **Returns**: Updated profile data
- **Notes**: Critical for RLS policies that depend on church_id

## Churches API

### Create Church

```javascript
const createChurch = async (churchData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('churches')
    .insert({
      name: churchData.name,
      location: churchData.location,
      description: churchData.description,
      created_by: user.id
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Creates a new church
- **Parameters**:
  - `churchData`: Object containing church details
- **Returns**: Created church data
- **Notes**: 
  - Sets current user as creator
  - Often followed by setUserChurch call

### Get Church

```javascript
const getChurch = async (churchId) => {
  const { data, error } = await supabase
    .from('churches')
    .select('*')
    .eq('id', churchId)
    .single();
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Retrieves details for a specific church
- **Parameters**:
  - `churchId`: UUID of the church
- **Returns**: Church data
- **Notes**: Uses RLS to determine if user can access

### List Churches

```javascript
const listChurches = async (options = {}) => {
  let query = supabase
    .from('churches')
    .select('*');
  
  // Apply search filter if provided
  if (options.search) {
    query = query.ilike('name', `%${options.search}%`);
  }
  
  // Apply pagination
  if (options.page && options.limit) {
    const from = (options.page - 1) * options.limit;
    const to = from + options.limit - 1;
    query = query.range(from, to);
  }
  
  // Apply sorting
  if (options.sortBy) {
    const order = options.sortDirection === 'desc' ? 'desc' : 'asc';
    query = query.order(options.sortBy, { ascending: order === 'asc' });
  } else {
    query = query.order('name', { ascending: true });
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Lists churches with optional filtering
- **Parameters**:
  - `options`: Object containing search, pagination, sorting parameters
- **Returns**: Array of church data
- **Notes**: Flexible query builder pattern

### Update Church

```javascript
const updateChurch = async (churchId, churchData) => {
  const { data, error } = await supabase
    .from('churches')
    .update({
      name: churchData.name,
      location: churchData.location,
      description: churchData.description,
      logo_url: churchData.logoUrl,
      updated_at: new Date()
    })
    .eq('id', churchId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Updates church information
- **Parameters**:
  - `churchId`: UUID of the church
  - `churchData`: Object containing fields to update
- **Returns**: Updated church data
- **Notes**: RLS ensures only admins can update

## Events API

### Create Event

```javascript
const createEvent = async (eventData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Get user's church_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', user.id)
    .single();
  
  if (!profile.church_id) throw new Error('User must belong to a church');
  
  const { data, error } = await supabase
    .from('events')
    .insert({
      church_id: profile.church_id,
      team_id: eventData.teamId,
      title: eventData.title,
      description: eventData.description,
      start_time: eventData.startTime,
      end_time: eventData.endTime,
      location: eventData.location,
      event_type: eventData.eventType,
      created_by: user.id
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Creates a new event
- **Parameters**:
  - `eventData`: Object containing event details
- **Returns**: Created event data
- **Notes**: 
  - Uses user's church_id from profile
  - Validates user belongs to a church

### Get Events By Date Range

```javascript
const getEventsByDateRange = async (startDate, endDate) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Get user's church_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', user.id)
    .single();
  
  if (!profile.church_id) throw new Error('User must belong to a church');
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', profile.church_id)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time', { ascending: true });
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Retrieves events within a date range
- **Parameters**:
  - `startDate`: ISO date string for range start
  - `endDate`: ISO date string for range end
- **Returns**: Array of event data
- **Notes**: 
  - Filters by user's church_id
  - Orders by start time

### Update Event

```javascript
const updateEvent = async (eventId, eventData) => {
  const { data, error } = await supabase
    .from('events')
    .update({
      title: eventData.title,
      description: eventData.description,
      start_time: eventData.startTime,
      end_time: eventData.endTime,
      location: eventData.location,
      event_type: eventData.eventType,
      team_id: eventData.teamId,
      updated_at: new Date()
    })
    .eq('id', eventId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Updates event information
- **Parameters**:
  - `eventId`: UUID of the event
  - `eventData`: Object containing fields to update
- **Returns**: Updated event data
- **Notes**: RLS ensures only authorized users can update

## Songs API

### Create Song

```javascript
const createSong = async (songData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Get user profile to check church_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', user.id)
    .single();
  
  if (!profile.church_id) throw new Error('User must belong to a church');
  
  const { data, error } = await supabase
    .from('songs')
    .insert({
      church_id: profile.church_id,
      title: songData.title,
      artist: songData.artist,
      default_key: songData.defaultKey,
      tempo: songData.tempo,
      lyrics: songData.lyrics,
      chords: songData.chords,
      notes: songData.notes,
      created_by: user.id
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Creates a new song
- **Parameters**:
  - `songData`: Object containing song details
- **Returns**: Created song data
- **Notes**: 
  - Uses user's church_id from profile
  - Validates user belongs to a church

### Get Songs

```javascript
const getSongs = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Get user's church_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', user.id)
    .single();
  
  if (!profile.church_id) throw new Error('User must belong to a church');
  
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('church_id', profile.church_id)
    .order('title', { ascending: true });
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Retrieves songs for user's church
- **Returns**: Array of song data
- **Notes**: 
  - Filters by user's church_id
  - Orders alphabetically by title

## Prayer Requests API

### Create Prayer Request

```javascript
const createPrayerRequest = async (prayerData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Get user profile to check church_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', user.id)
    .single();
  
  if (!profile.church_id) throw new Error('User must belong to a church');
  
  const { data, error } = await supabase
    .from('prayer_requests')
    .insert({
      user_id: user.id,
      church_id: profile.church_id,
      title: prayerData.title,
      description: prayerData.description,
      is_anonymous: prayerData.isAnonymous,
      is_private: prayerData.isPrivate
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Creates a new prayer request
- **Parameters**:
  - `prayerData`: Object containing prayer request details
- **Returns**: Created prayer request data
- **Notes**: Includes privacy options for anonymous/private requests

### Get Prayer Requests

```javascript
const getPrayerRequests = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Get user's church_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', user.id)
    .single();
  
  if (!profile.church_id) throw new Error('User must belong to a church');
  
  const { data, error } = await supabase
    .from('prayer_requests')
    .select('*')
    .eq('church_id', profile.church_id)
    .eq('is_private', false)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};
```

- **Purpose**: Retrieves public prayer requests for user's church
- **Returns**: Array of prayer request data
- **Notes**: 
  - Filters out private requests
  - Orders by newest first

## File Storage API

### Upload Avatar

```javascript
const uploadAvatar = async (file) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const fileExt = file.name.split('.').pop();
  const fileName = `avatars/${user.id}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);
  
  // Update profile with new avatar URL
  await updateProfile({ avatarUrl: publicUrl });
  
  return publicUrl;
};
```

- **Purpose**: Uploads user avatar
- **Parameters**:
  - `file`: File object to upload
- **Returns**: Public URL of uploaded file
- **Notes**: 
  - Generates unique filename
  - Updates profile with URL
  - Uses 'avatars' bucket

### Upload Church Logo

```javascript
const uploadChurchLogo = async (churchId, file) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${churchId}/logo.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('church-logos')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('church-logos')
    .getPublicUrl(fileName);
  
  // Update church with new logo URL
  await updateChurch(churchId, { logoUrl: publicUrl });
  
  return publicUrl;
};
```

- **Purpose**: Uploads church logo
- **Parameters**:
  - `churchId`: UUID of the church
  - `file`: File object to upload
- **Returns**: Public URL of uploaded file
- **Notes**: 
  - Updates church with URL
  - Uses 'church-logos' bucket
  - RLS ensures only admins can upload

## Error Handling

All API functions follow consistent error handling:

1. Throw errors from Supabase responses
2. Handle errors in components with try/catch
3. Display user-friendly error messages
4. Log errors for debugging

Example error handling in components:

```javascript
try {
  const data = await createChurch(churchData);
  // Handle success
} catch (error) {
  console.error('Error creating church:', error);
  setError(error.message || 'An error occurred');
}
```

## React Query Implementation

For optimal data fetching, these API functions are integrated with React Query:

```javascript
// Query example
const { data: events, isLoading, error } = useQuery(
  ['events', dateRange.start, dateRange.end],
  () => getEventsByDateRange(dateRange.start, dateRange.end),
  {
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true
  }
);

// Mutation example
const createEventMutation = useMutation(
  (eventData) => createEvent(eventData),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast.success('Event created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create event');
    }
  }
);
```

## API Utilities

Additional utility functions facilitate common operations:

### Format Query Parameters

```javascript
const formatQueryParams = (params) => {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
};
```

### Handle Pagination Results

```javascript
const handlePaginationResults = (result) => {
  return {
    data: result.data,
    count: result.count,
    hasMore: result.data.length === result.count
  };
};
```

These API functions provide a consistent interface for interacting with the Supabase backend throughout the Church Connect application.
