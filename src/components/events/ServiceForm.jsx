// src/components/events/ServiceForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCalendarAlt, FaUsers } from 'react-icons/fa';
import dayjs from 'dayjs';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import SongSelector from './SongSelector';
import TeamMembersSelector from './TeamMembersSelector';

const ServiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [churches, setChurches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [error, setError] = useState(null);
  
  // Set default date to today
  const today = dayjs();
  const defaultTitle = `Service - ${today.format('MMMM D, YYYY')}`;
  const serviceDate = today.format('YYYY-MM-DD');
  
  const [formData, setFormData] = useState({
    title: defaultTitle,
    description: '',
    // Use the selected date for both start and end time
    start_time: `${serviceDate}T09:00`,
    end_time: `${serviceDate}T10:30`,
    service_date: serviceDate,
    location: 'Church',
    church_id: '',
    team_id: null, // Changed from empty string to null
    event_type: 'service',
    created_by: user?.id
  });
  
  // Update the title when the date changes
  useEffect(() => {
    if (formData.service_date && !isEditMode) {
      const newDate = dayjs(formData.service_date);
      setFormData(prev => ({
        ...prev,
        title: `Service - ${newDate.format('MMMM D, YYYY')}`,
        start_time: `${formData.service_date}T09:00`,
        end_time: `${formData.service_date}T10:30`
      }));
    }
  }, [formData.service_date, isEditMode]);
  
  // Fetch churches
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch churches
        const { data: churchData, error: churchError } = await supabase
          .from('churches')
          .select('id, name');
        
        if (churchError) throw churchError;
        setChurches(churchData || []);
        
        // If church_id is already set (edit mode or changed), fetch teams for this church
        if (formData.church_id) {
          const { data: teamData, error: teamError } = await supabase
            .from('worship_teams')
            .select('id, name, description')
            .eq('church_id', formData.church_id);
          
          if (teamError) throw teamError;
          setTeams(teamData || []);
        }
        
        // If editing, fetch existing service data
        if (isEditMode) {
          const { data: serviceData, error: serviceError } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();
          
          if (serviceError) throw serviceError;
          
          if (serviceData) {
            const serviceDate = dayjs(serviceData.start_time).format('YYYY-MM-DD');
            
            setFormData({
              ...serviceData,
              start_time: dayjs(serviceData.start_time).format('YYYY-MM-DDTHH:mm'),
              end_time: dayjs(serviceData.end_time).format('YYYY-MM-DDTHH:mm'),
              service_date: serviceDate
            });
            
            // Fetch selected songs for this service
            const { data: songData, error: songError } = await supabase
              .from('event_songs')
              .select('id, song_id, song_order, key, notes, songs(id, title, artist, default_key)')
              .eq('event_id', id)
              .order('song_order');
            
            if (songError) throw songError;
            
            if (songData) {
              setSelectedSongs(songData.map(item => ({
                id: item.id,
                songId: item.song_id,
                order: item.song_order,
                key: item.key || item.songs?.default_key || '',
                notes: item.notes || '',
                title: item.songs?.title || '',
                artist: item.songs?.artist || ''
              })));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error loading data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode, user]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle UUID fields specially
    if (name === 'church_id' || name === 'team_id') {
      const finalValue = value === '' ? null : value; // Convert empty strings to null
      setFormData(prev => ({ ...prev, [name]: finalValue }));
      
      // If church_id changes, fetch teams for this church and reset team_id
      if (name === 'church_id') {
        fetchTeamsForChurch(finalValue);
        setFormData(prev => ({ ...prev, team_id: null }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const fetchTeamsForChurch = async (churchId) => {
    if (!churchId) {
      setTeams([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('worship_teams')
        .select('id, name, description')
        .eq('church_id', churchId);
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Error loading teams. Please try again.');
    }
  };
  
  const handleSongsChange = (songs) => {
    setSelectedSongs(songs);
  };
  
  const handleTeamMembersChange = (members) => {
    setSelectedTeamMembers(members);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      // Validate required fields
      if (!formData.church_id) {
        setError('Please select a church');
        setSaving(false);
        return;
      }
      
      // Format data for Supabase, ensuring all UUID fields are either valid or null (not empty strings)
      const serviceData = {
        ...formData,
        start_time: dayjs(formData.start_time).toISOString(),
        end_time: dayjs(formData.end_time).toISOString(),
        created_by: user.id,
        // Ensure UUID fields are either valid or null
        team_id: formData.team_id || null,
        church_id: formData.church_id || null
      };
      
      // Remove the service_date field as it's not in the database schema
      delete serviceData.service_date;
      
      // Log the data being sent to help debug
      console.log('Submitting service data:', serviceData);
      
      let serviceId = id;
      
      // Create or update the service
      if (isEditMode) {
        const { error } = await supabase
          .from('events')
          .update(serviceData)
          .eq('id', id);
        
        if (error) {
          console.error('Error updating service:', error);
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert(serviceData)
          .select('id')
          .single();
        
        if (error) {
          console.error('Error creating service:', error);
          throw error;
        }
        
        if (!data || !data.id) {
          throw new Error('No service ID returned from creation');
        }
        
        serviceId = data.id;
      }
      
      // Handle service songs
      if (serviceId) {
        console.log('Service ID for songs and team members:', serviceId);
        
        // If editing, first delete existing song associations not in the current selection
        if (isEditMode) {
          const existingIds = selectedSongs
            .filter(song => song.id)
            .map(song => song.id);
          
          if (existingIds.length > 0) {
            const { error } = await supabase
              .from('event_songs')
              .delete()
              .eq('event_id', serviceId)
              .not('id', 'in', `(${existingIds.join(',')})`);
            
            if (error) {
              console.error('Error deleting songs:', error);
              throw error;
            }
          } else {
            // If no existing IDs, delete all associations
            const { error } = await supabase
              .from('event_songs')
              .delete()
              .eq('event_id', serviceId);
            
            if (error) {
              console.error('Error deleting all songs:', error);
              throw error;
            }
          }
        }
        
        // Create or update song associations
        for (const song of selectedSongs) {
          if (song.id) {
            // Update existing association
            const { error } = await supabase
              .from('event_songs')
              .update({
                song_order: song.order,
                key: song.key,
                notes: song.notes
              })
              .eq('id', song.id);
            
            if (error) {
              console.error('Error updating song:', error);
              throw error;
            }
          } else {
            // Create new association
            const newSong = {
              event_id: serviceId,
              song_id: song.songId,
              song_order: song.order,
              key: song.key,
              notes: song.notes
            };
            
            console.log('Adding new song to service:', newSong);
            
            const { error } = await supabase
              .from('event_songs')
              .insert(newSong);
            
            if (error) {
              console.error('Error adding song:', error);
              throw error;
            }
          }
        }
        
        // Handle team member assignments
        if (selectedTeamMembers.length > 0) {
          console.log('Saving team member assignments:', selectedTeamMembers);
          
          // If editing, first delete existing assignments not in the current selection
          if (isEditMode) {
            const existingIds = selectedTeamMembers
              .filter(member => member.id)
              .map(member => member.id);
            
            if (existingIds.length > 0) {
              const { error } = await supabase
                .from('service_team_members')
                .delete()
                .eq('event_id', serviceId)
                .not('id', 'in', `(${existingIds.join(',')})`);
              
              if (error) {
                console.error('Error deleting team members:', error);
                throw error;
              }
            } else {
              // If no existing IDs, delete all associations
              const { error } = await supabase
                .from('service_team_members')
                .delete()
                .eq('event_id', serviceId);
              
              if (error) {
                console.error('Error deleting all team members:', error);
                throw error;
              }
            }
          }
          
          // Create or update team member assignments
          for (const member of selectedTeamMembers) {
            if (member.id) {
              // Update existing assignment
              const { error } = await supabase
                .from('service_team_members')
                .update({
                  role: member.role,
                  notes: member.notes,
                  is_confirmed: member.isConfirmed
                })
                .eq('id', member.id);
              
              if (error) {
                console.error('Error updating team member:', error);
                throw error;
              }
            } else {
              // Create new assignment
              const newMember = {
                event_id: serviceId,
                user_id: member.userId,
                role: member.role,
                notes: member.notes,
                is_confirmed: member.isConfirmed || false
              };
              
              console.log('Adding new team member to service:', newMember);
              
              const { error } = await supabase
                .from('service_team_members')
                .insert(newMember);
              
              if (error) {
                console.error('Error adding team member:', error);
                throw error;
              }
            }
          }
        }
      } else {
        throw new Error('Failed to get a valid service ID');
      }
      
      // Redirect back to calendar
      navigate('/calendar');
    } catch (error) {
      console.error('Error saving service:', error);
      setError(`Error saving service: ${error.message || 'Please try again'}`);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-4 mb-20"> {/* Added mb-20 for extra bottom margin */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edit Service' : 'Create New Service'}
      </h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Service Information */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4 mb-4"> {/* Added mb-4 */}
          <h2 className="text-lg font-medium text-gray-900">Service Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2"> {/* Added mb-2 */}
            <div>
              <label htmlFor="service_date" className="block text-sm font-medium text-gray-700">
                <FaCalendarAlt className="inline mr-1" /> Service Date*
              </label>
              <input
                type="date"
                id="service_date"
                name="service_date"
                required
                value={formData.service_date}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="church_id" className="block text-sm font-medium text-gray-700">
                Church*
              </label>
              <select
                id="church_id"
                name="church_id"
                required
                value={formData.church_id || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Church</option>
                {churches.map(church => (
                  <option key={church.id} value={church.id}>
                    {church.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Service Title*
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Team Selection Section - Temporarily hidden
        {formData.church_id && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4 mb-4">
            <h2 className="text-lg font-medium text-gray-900">Worship Team</h2>
            
            <div>
              <label htmlFor="team_id" className="block text-sm font-medium text-gray-700">
                <FaUsers className="inline mr-1" /> Select Team
              </label>
              <select
                id="team_id"
                name="team_id"
                value={formData.team_id || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No team assigned</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            
            {formData.team_id && (
              <div className="mt-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">Team Members</h3>
                <TeamMembersSelector
                  teamId={formData.team_id}
                  eventId={id}
                  churchId={formData.church_id}
                  onMembersChange={handleTeamMembersChange}
                />
              </div>
            )}
          </div>
        )}
        */}
        
        {/* Song Selection Section - Only show if church is selected */}
        {formData.church_id && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4 mb-8"> {/* Added mb-8 */}
            <h2 className="text-lg font-medium text-gray-900">Service Songs</h2>
            <SongSelector 
              selectedSongs={selectedSongs} 
              onSongsChange={handleSongsChange}
              churchId={formData.church_id}
            />
          </div>
        )}
        
        {/* Submit Button */}
        <div className="flex justify-center mb-16"> {/* Added mb-16 for extra bottom space */}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditMode ? 'Update Service' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;
