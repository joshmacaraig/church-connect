// src/lib/songAPI.js
import { supabase } from './supabase';

/**
 * API functions for song management
 */

/**
 * Fetch all songs for the current user's church
 * @returns {Promise<Array>} Array of song objects
 */
export const fetchSongs = async () => {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('title', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

/**
 * Fetch a single song by ID
 * @param {string} id - Song ID
 * @returns {Promise<Object>} Song object
 */
export const fetchSongById = async (id) => {
  try {
    // First, fetch the song data
    const { data: song, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!song) throw new Error('Song not found');
    
    // Initialize empty tags array
    song.tags = [];
    
    try {
      // Attempt to fetch tag data, but handle the case where the table might not exist yet
      // Check if the song_tag_assignments table exists by making a small query
      const { error: checkError } = await supabase
        .from('song_tag_assignments')
        .select('id')
        .limit(1);
      
      // If there's no error, the table exists and we can proceed with fetching tags
      if (!checkError) {
        // Fetch the song tags
        const { data: tagAssignments } = await supabase
          .from('song_tag_assignments')
          .select('tag_id')
          .eq('song_id', id);
        
        // If there are tags, fetch the tag details
        if (tagAssignments && tagAssignments.length > 0) {
          const tagIds = tagAssignments.map(assignment => assignment.tag_id);
          
          const { data: tags } = await supabase
            .from('song_tags')
            .select('id, name, color')
            .in('id', tagIds);
          
          // Add tags to the song object
          if (tags && tags.length > 0) {
            song.tags = tags;
          }
        }
      }
    } catch (tagError) {
      // If there's an error with the tags, just continue with an empty tags array
      console.warn('Could not fetch song tags:', tagError);
      // Don't rethrow the error, we want to continue even if tags can't be fetched
    }
    
    return song;
  } catch (error) {
    console.error('Error in fetchSongById:', error);
    throw error;
  }
};

/**
 * Create a new song
 * @param {Object} songData - Song data object
 * @returns {Promise<Object>} Newly created song
 */
export const createSong = async (songData) => {
  // Get user's church_id
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user?.id) {
    throw new Error('User not authenticated');
  }
  
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', userData.user.id)
    .single();
  
  if (profileError) throw profileError;
  if (!profileData.church_id) {
    throw new Error('User not associated with a church');
  }
  
  // Add church_id and created_by to song data
  const songWithMetadata = {
    ...songData,
    church_id: profileData.church_id,
    created_by: userData.user.id
  };
  
  // Extract tags if they exist
  const tags = songWithMetadata.tags || [];
  delete songWithMetadata.tags;
  
  // Insert song
  const { data, error } = await supabase
    .from('songs')
    .insert(songWithMetadata)
    .select()
    .single();
  
  if (error) throw error;
  
  // If tags were provided, try to assign them to the song
  if (tags.length > 0 && data) {
    try {
      await assignTagsToSong(data.id, tags);
    } catch (tagError) {
      // If there's an error with tags, log it but don't fail the song creation
      console.warn('Could not assign tags to song:', tagError);
    }
  }
  
  return data;
};

/**
 * Update an existing song
 * @param {string} id - Song ID
 * @param {Object} songData - Updated song data
 * @returns {Promise<Object>} Updated song
 */
export const updateSong = async (id, songData) => {
  // Extract tags if they exist
  const tags = songData.tags || [];
  const songWithoutTags = { ...songData };
  delete songWithoutTags.tags;
  
  // Update song
  const { data, error } = await supabase
    .from('songs')
    .update(songWithoutTags)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Update tags if they were provided
  if (tags.length > 0) {
    try {
      // Check if the song_tag_assignments table exists
      const { error: checkError } = await supabase
        .from('song_tag_assignments')
        .select('id')
        .limit(1);
        
      if (!checkError) {
        // First remove existing tag assignments
        await supabase
          .from('song_tag_assignments')
          .delete()
          .eq('song_id', id);
        
        // Then add new ones
        await assignTagsToSong(id, tags);
      }
    } catch (tagError) {
      // If there's an error with tags, log it but don't fail the song update
      console.warn('Could not update song tags:', tagError);
    }
  }
  
  return data;
};

/**
 * Delete a song
 * @param {string} id - Song ID
 * @returns {Promise<void>}
 */
export const deleteSong = async (id) => {
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

/**
 * Search songs by query
 * @param {string} query - Search term
 * @returns {Promise<Array>} Array of matching songs
 */
export const searchSongs = async (query) => {
  // Get user's church_id
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user?.id) {
    throw new Error('User not authenticated');
  }
  
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', userData.user.id)
    .single();
  
  if (profileError) throw profileError;
  
  // Use the custom search function
  const { data, error } = await supabase
    .rpc('search_songs', { 
      search_term: query,
      church_id_param: profileData.church_id
    });
  
  if (error) throw error;
  return data || [];
};

/**
 * Fetch songs by key
 * @param {string} key - Musical key (e.g., 'C', 'Am')
 * @returns {Promise<Array>} Array of songs in the specified key
 */
export const fetchSongsByKey = async (key) => {
  // Get user's church_id
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user?.id) {
    throw new Error('User not authenticated');
  }
  
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', userData.user.id)
    .single();
  
  if (profileError) throw profileError;
  
  const { data, error } = await supabase
    .rpc('get_songs_by_key', {
      key_param: key,
      church_id_param: profileData.church_id
    });
  
  if (error) throw error;
  return data || [];
};

/**
 * Fetch all song tags for the user's church
 * @returns {Promise<Array>} Array of tag objects
 */
export const fetchSongTags = async () => {
  try {
    // Check if the song_tags table exists first
    const { error: checkError } = await supabase
      .from('song_tags')
      .select('id')
      .limit(1);
      
    if (checkError) {
      // If table doesn't exist, return empty array
      return [];
    }
    
    const { data, error } = await supabase
      .from('song_tags')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('Could not fetch song tags:', error);
    return [];
  }
};

/**
 * Create a new song tag
 * @param {Object} tagData - Tag data (name, color)
 * @returns {Promise<Object>} Newly created tag
 */
export const createSongTag = async (tagData) => {
  // Get user's church_id
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user?.id) {
    throw new Error('User not authenticated');
  }
  
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('church_id')
    .eq('id', userData.user.id)
    .single();
  
  if (profileError) throw profileError;
  
  const { data, error } = await supabase
    .from('song_tags')
    .insert({
      ...tagData,
      church_id: profileData.church_id,
      created_by: userData.user.id
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Fetch songs by tag
 * @param {string} tagName - Tag name
 * @returns {Promise<Array>} Array of songs with the specified tag
 */
export const fetchSongsByTag = async (tagName) => {
  try {
    // Get user's church_id
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user?.id) {
      throw new Error('User not authenticated');
    }
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', userData.user.id)
      .single();
    
    if (profileError) throw profileError;
    
    // Check if the function exists first
    const { error: functionCheckError } = await supabase
      .rpc('get_songs_by_tag', {
        tag_name: 'test',
        church_id_param: profileData.church_id
      });
      
    // If function doesn't exist or table doesn't exist, return empty array
    if (functionCheckError && functionCheckError.message.includes('does not exist')) {
      return [];
    }
    
    const { data, error } = await supabase
      .rpc('get_songs_by_tag', {
        tag_name: tagName,
        church_id_param: profileData.church_id
      });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('Could not fetch songs by tag:', error);
    return [];
  }
};

/**
 * Helper function to assign tags to a song
 * @param {string} songId - Song ID
 * @param {Array} tags - Array of tag IDs or tag objects
 * @returns {Promise<void>}
 */
const assignTagsToSong = async (songId, tags) => {
  // Convert any tag objects to tag IDs
  const tagIds = tags.map(tag => typeof tag === 'object' ? tag.id : tag);
  
  // Create assignment objects
  const assignments = tagIds.map(tagId => ({
    song_id: songId,
    tag_id: tagId
  }));
  
  // Skip if no assignments to make
  if (assignments.length === 0) return;
  
  // Insert assignments
  const { error } = await supabase
    .from('song_tag_assignments')
    .insert(assignments);
  
  if (error) throw error;
};

/**
 * Upload a song attachment file
 * @param {string} songId - Song ID
 * @param {File} file - File object to upload
 * @param {string} type - Attachment type ('chord-charts', 'sheet-music', 'backing-tracks')
 * @returns {Promise<string>} URL of the uploaded file
 */
export const uploadSongAttachment = async (songId, file, type) => {
  // Validate type
  const validTypes = ['chord-charts', 'sheet-music', 'backing-tracks'];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid attachment type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  // Get song details to get church_id
  const { data: songData, error: songError } = await supabase
    .from('songs')
    .select('church_id')
    .eq('id', songId)
    .single();
  
  if (songError) throw songError;
  
  // Construct the path
  const churchId = songData.church_id;
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${churchId}/${songId}/${type}/${fileName}`;
  
  // Upload the file
  const { data, error } = await supabase
    .storage
    .from('song-attachments')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: publicUrl } = supabase
    .storage
    .from('song-attachments')
    .getPublicUrl(data.path);
  
  return publicUrl.publicUrl;
};

/**
 * List song attachments for a song
 * @param {string} songId - Song ID
 * @returns {Promise<Object>} Object with arrays for each attachment type
 */
export const listSongAttachments = async (songId) => {
  try {
    // Get song details to get church_id
    const { data: songData, error: songError } = await supabase
      .from('songs')
      .select('church_id')
      .eq('id', songId)
      .single();
    
    if (songError) throw songError;
    
    const churchId = songData.church_id;
    const basePath = `${churchId}/${songId}`;
    
    // Get attachment types
    const types = ['chord-charts', 'sheet-music', 'backing-tracks'];
    const result = {};
    
    // Get files for each type
    for (const type of types) {
      const path = `${basePath}/${type}`;
      const { data, error } = await supabase
        .storage
        .from('song-attachments')
        .list(path);
      
      if (error && error.message !== 'The resource was not found') {
        throw error;
      }
      
      // Add public URLs to the files
      result[type] = (data || []).map(file => ({
        ...file,
        url: supabase.storage.from('song-attachments').getPublicUrl(`${path}/${file.name}`).data.publicUrl
      }));
    }
    
    return result;
  } catch (error) {
    console.warn('Could not list song attachments:', error);
    return {
      'chord-charts': [],
      'sheet-music': [],
      'backing-tracks': []
    };
  }
};

/**
 * Delete a song attachment
 * @param {string} songId - Song ID
 * @param {string} type - Attachment type
 * @param {string} fileName - File name
 * @returns {Promise<void>}
 */
export const deleteSongAttachment = async (songId, type, fileName) => {
  try {
    // Get song details to get church_id
    const { data: songData, error: songError } = await supabase
      .from('songs')
      .select('church_id')
      .eq('id', songId)
      .single();
    
    if (songError) throw songError;
    
    const churchId = songData.church_id;
    const filePath = `${churchId}/${songId}/${type}/${fileName}`;
    
    const { error } = await supabase
      .storage
      .from('song-attachments')
      .remove([filePath]);
    
    if (error) throw error;
  } catch (error) {
    console.warn('Could not delete song attachment:', error);
    throw error;
  }
};
