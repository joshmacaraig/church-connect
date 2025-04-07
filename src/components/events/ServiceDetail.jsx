// src/components/events/ServiceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaEdit, FaTrash, FaMusic, FaChurch, FaCheck, FaRegCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';
import dayjs from 'dayjs';
import { supabase } from '../../lib/supabase';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [service, setService] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [churchName, setChurchName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [updatingSong, setUpdatingSong] = useState(null);
  // Track completed songs locally
  const [completedSongs, setCompletedSongs] = useState(new Set());
  
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch service details
        const { data: serviceData, error: serviceError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();
        
        if (serviceError) throw serviceError;
        setService(serviceData);
        
        // Fetch church name
        if (serviceData?.church_id) {
          const { data: churchData, error: churchError } = await supabase
            .from('churches')
            .select('name')
            .eq('id', serviceData.church_id)
            .single();
          
          if (!churchError && churchData) {
            setChurchName(churchData.name);
          }
        }
        
        // Fetch team name
        if (serviceData?.team_id) {
          const { data: teamData, error: teamError } = await supabase
            .from('worship_teams')
            .select('name')
            .eq('id', serviceData.team_id)
            .single();
          
          if (!teamError && teamData) {
            setTeamName(teamData.name);
          }
        }
        
        // Fetch songs for this service
        const { data: songData, error: songError } = await supabase
          .from('event_songs')
          .select(`
            id,
            song_order,
            key,
            notes,
            is_done,
            songs (
              id,
              title,
              artist,
              default_key
            )
          `)
          .eq('event_id', id)
          .order('song_order');
        
        if (songError) {
          console.error('Error fetching songs:', songError);
          throw songError;
        }
        console.log('Songs data:', songData);
        
        if (songData) {
          // Try to get is_done status if it exists
          try {
            // Check if any song has is_done field
            const hasDoneField = songData.some(song => 'is_done' in song);
            
            if (hasDoneField) {
              // Initialize completed songs based on is_done field
              const initialCompleted = new Set(
                songData.filter(song => song.is_done).map(song => song.id)
              );
              setCompletedSongs(initialCompleted);
            }
          } catch (err) {
            console.log('No is_done field yet, using local state only');
          }
          
          setSongs(songData);
        } else {
          setSongs([]);
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [id]);
  
  const handleSongClick = (songId) => {
    // Don't do anything if we're in the middle of updating status
    if (updatingSong) return;
    
    try {
      // Find song in current songs list
      const song = songs.find(s => s.id === songId);
      
      if (!song) return;
      
      // Navigate to the song detail page, passing service-specific info as URL parameters
      const isDoneStatus = completedSongs.has(songId);
      navigate(`/songs/${song.songs.id}?serviceKey=${encodeURIComponent(song.key || song.songs.default_key)}&eventId=${id}&eventSongId=${songId}&notes=${encodeURIComponent(song.notes || '')}&isDone=${isDoneStatus}`);
    } catch (error) {
      console.error('Error navigating to song details:', error);
      alert('Could not navigate to song details. Please try again.');
    }
  };
  
  const handleEdit = () => {
    navigate(`/services/edit/${id}`);
  };
  
  const handleToggleSongDone = async (songId, e) => {
    // Stop propagation to prevent opening the song details
    if (e) e.stopPropagation();
    
    try {
      setUpdatingSong(songId);
      
      // Update local state first for immediate feedback
      setCompletedSongs(prev => {
        const newSet = new Set(prev);
        if (newSet.has(songId)) {
          newSet.delete(songId);
        } else {
          newSet.add(songId);
        }
        return newSet;
      });
      
      // Try to update the database if is_done field exists
      try {
        const { error } = await supabase
          .from('event_songs')
          .update({ 
            is_done: !completedSongs.has(songId)
          })
          .eq('id', songId);
        
        if (error) {
          // If field doesn't exist, this will silently fail but UI will still work
          console.log('Could not update is_done in database:', error);
        }
      } catch (err) {
        console.log('Error updating is_done field:', err);
        // Continue with local state only
      }
    } catch (error) {
      console.error('Error updating song status:', error);
      alert('Failed to update song status. Please try again.');
      
      // Revert the local state change on error
      setCompletedSongs(prev => {
        const newSet = new Set(prev);
        if (newSet.has(songId)) {
          newSet.delete(songId);
        } else {
          newSet.add(songId);
        }
        return newSet;
      });
    } finally {
      setUpdatingSong(null);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      try {
        setDeleting(true);
        
        // Delete event_songs entries first (due to foreign key constraints)
        const { error: songsError } = await supabase
          .from('event_songs')
          .delete()
          .eq('event_id', id);
        
        if (songsError) throw songsError;
        
        // Delete service_team_members entries
        // Temporarily commented out until the table is properly set up
        /* 
        const { error: teamMembersError } = await supabase
          .from('service_team_members')
          .delete()
          .eq('event_id', id);
        
        if (teamMembersError) throw teamMembersError;
        */
        
        // Then delete the service itself
        const { error: serviceError } = await supabase
          .from('events')
          .delete()
          .eq('id', id);
        
        if (serviceError) throw serviceError;
        
        // Navigate back to calendar
        navigate('/calendar');
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Error deleting service. Please try again.');
      } finally {
        setDeleting(false);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!service) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h1>
        <p className="text-gray-600 mb-4">The service you're looking for doesn't exist or has been deleted.</p>
        <button
          onClick={() => navigate('/calendar')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Calendar
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{service.title}</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
            title="Edit service"
          >
            <FaEdit size={20} />
          </button>
          
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full disabled:opacity-50"
            title="Delete service"
          >
            <FaTrash size={20} />
          </button>
        </div>
      </div>
      
      {/* Service Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="space-y-4">
          {service.description && (
            <p className="text-gray-700">{service.description}</p>
          )}
          
          {/* Date and time */}
          <div className="flex items-start space-x-2">
            <FaCalendarAlt className="mt-1 text-gray-500" />
            <div>
              <div className="font-medium">
                {dayjs(service.start_time).format('dddd, MMMM D, YYYY')}
              </div>
              <div className="text-sm text-gray-500 flex items-center">
                <FaClock className="mr-1" />
                {dayjs(service.start_time).format('h:mm A')} - {dayjs(service.end_time).format('h:mm A')}
              </div>
            </div>
          </div>
          
          {/* Location */}
          {service.location && (
            <div className="flex items-start space-x-2">
              <FaMapMarkerAlt className="mt-1 text-gray-500" />
              <div>{service.location}</div>
            </div>
          )}
          
          {/* Church */}
          {churchName && (
            <div className="flex items-start space-x-2">
              <FaChurch className="mt-1 text-gray-500" />
              <div>{churchName}</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Songs List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FaMusic className="mr-2" /> Service Songs
        </h2>
        
        {songs.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No songs have been added to this service.
          </div>
        ) : (
          <>
            <div className="mb-2 text-sm text-gray-600">Total songs: {songs.length}</div>
            <ul className="divide-y divide-gray-200">
              {songs.map((item) => {
                const isDone = completedSongs.has(item.id);
                return (
                <li key={item.id} className={`py-4 ${isDone ? 'bg-green-50' : ''} hover:bg-gray-50`}>
                  <div className="flex items-start">
                    <div className="h-8 w-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-3 font-medium">
                      {item.song_order}
                    </div>
                    <div className="flex-grow cursor-pointer" onClick={() => handleSongClick(item.id)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className={`font-medium ${isDone ? 'line-through text-gray-500' : ''}`}>
                            {item.songs?.title || 'Unknown Title'}
                          </h3>
                          {item.songs?.artist && (
                            <p className="text-sm text-gray-500">{item.songs.artist}</p>
                          )}
                          
                          <div className="mt-1 flex flex-wrap gap-2">
                            {item.key && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Key: {item.key}
                              </span>
                            )}
                            
                            {item.notes && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Notes: {item.notes}
                              </span>
                            )}
                            
                            {isDone && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <FaCheck className="mr-1" size={10} /> Completed
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => handleToggleSongDone(item.id, e)}
                          disabled={updatingSong === item.id}
                          className={`ml-2 p-2 rounded-full ${isDone 
                            ? 'text-green-600 hover:bg-green-100' 
                            : 'text-gray-400 hover:bg-gray-100'} 
                            ${updatingSong === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={isDone ? "Mark as incomplete" : "Mark as complete"}
                        >
                          {updatingSong === item.id ? (
                            <div className="animate-spin h-5 w-5 border-2 border-green-500 rounded-full border-t-transparent" />
                          ) : isDone ? (
                            <FaCheckCircle size={20} />
                          ) : (
                            <FaRegCircle size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceDetail;
