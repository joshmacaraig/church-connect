// supabase/functions/api-utils.js

/**
 * Utility functions for Church Connect API
 * This file contains common functions for interacting with Supabase
 */

// Profiles API
export const profilesApi = {
  /**
   * Get current user profile
   * @param {Object} supabase - Supabase client
   * @returns {Promise} - Profile data or error
   */
  async getCurrentProfile(supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  /**
   * Update user profile
   * @param {Object} supabase - Supabase client
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} - Updated profile data or error
   */
  async updateProfile(supabase, profileData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Update auth email if provided
    if (profileData.email) {
      const { error: updateError } = await supabase.auth.updateUser({
        email: profileData.email
      });
      if (updateError) throw updateError;
    }
    
    // Update profile data
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: profileData.fullName,
        updated_at: new Date()
      })
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  /**
   * Set user church
   * @param {Object} supabase - Supabase client
   * @param {string} churchId - Church ID
   * @returns {Promise} - Updated profile data or error
   */
  async setUserChurch(supabase, churchId) {
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
  }
};

// Churches API
export const churchesApi = {
  /**
   * Create a new church
   * @param {Object} supabase - Supabase client
   * @param {Object} churchData - Church data
   * @returns {Promise} - Created church data or error
   */
  async createChurch(supabase, churchData) {
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
    
    // Automatically set the user's church to the newly created one
    await profilesApi.setUserChurch(supabase, data.id);
    
    // Update the user's role to admin for the new church
    await supabase
      .from('profiles')
      .update({
        user_role: 'admin'
      })
      .eq('id', user.id);
    
    return data;
  },
  
  /**
   * Get church by ID
   * @param {Object} supabase - Supabase client
   * @param {string} churchId - Church ID
   * @returns {Promise} - Church data or error
   */
  async getChurch(supabase, churchId) {
    const { data, error } = await supabase
      .from('churches')
      .select('*')
      .eq('id', churchId)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  /**
   * List all churches
   * @param {Object} supabase - Supabase client
   * @param {Object} options - Search options
   * @returns {Promise} - List of churches or error
   */
  async listChurches(supabase, options = {}) {
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
  }
};

// Events API
export const eventsApi = {
  /**
   * Create a new event
   * @param {Object} supabase - Supabase client
   * @param {Object} eventData - Event data
   * @returns {Promise} - Created event data or error
   */
  async createEvent(supabase, eventData) {
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
  },
  
  /**
   * Get events for a date range
   * @param {Object} supabase - Supabase client
   * @param {string} startDate - Start date ISO string
   * @param {string} endDate - End date ISO string
   * @returns {Promise} - List of events or error
   */
  async getEventsByDateRange(supabase, startDate, endDate) {
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
  }
};

// Songs API
export const songsApi = {
  /**
   * Create a new song
   * @param {Object} supabase - Supabase client
   * @param {Object} songData - Song data
   * @returns {Promise} - Created song data or error
   */
  async createSong(supabase, songData) {
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
  },
  
  /**
   * Get songs for church
   * @param {Object} supabase - Supabase client
   * @returns {Promise} - List of songs or error
   */
  async getSongs(supabase) {
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
  }
};

// Prayer Requests API
export const prayerRequestsApi = {
  /**
   * Create a new prayer request
   * @param {Object} supabase - Supabase client
   * @param {Object} prayerData - Prayer request data
   * @returns {Promise} - Created prayer request data or error
   */
  async createPrayerRequest(supabase, prayerData) {
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
  },
  
  /**
   * Get prayer requests for church
   * @param {Object} supabase - Supabase client
   * @returns {Promise} - List of prayer requests or error
   */
  async getPrayerRequests(supabase) {
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
  }
};

// Export all APIs
export default {
  profiles: profilesApi,
  churches: churchesApi,
  events: eventsApi,
  songs: songsApi,
  prayerRequests: prayerRequestsApi
};
