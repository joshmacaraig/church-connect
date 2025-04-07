// src/components/songs/SongDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaMusic, FaPaperclip, FaChevronDown, FaChevronUp, FaExchangeAlt, FaCalendarCheck, FaCheck } from 'react-icons/fa';
import { transposeChordLine, getMusicalKeys } from '../../lib/chordTransposer';
import { fetchSongById } from '../../lib/songAPI';
import { supabase } from '../../lib/supabase';
import ChordDisplay from './ChordDisplay';
import SongTags from './SongTags';
import SongAttachments from './SongAttachments';

const SongDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract query parameters for service-specific information
  const queryParams = new URLSearchParams(location.search);
  const serviceKey = queryParams.get('serviceKey');
  const eventId = queryParams.get('eventId');
  const eventSongId = queryParams.get('eventSongId');
  const serviceNotes = queryParams.get('notes');
  const isDoneParam = queryParams.get('isDone');
  
  const [song, setSong] = useState(null);
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentKey, setCurrentKey] = useState('');
  const [transposedChords, setTransposedChords] = useState('');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('song'); // 'song' or 'attachments'
  const [showMetadata, setShowMetadata] = useState(false);
  const [showTransposeOptions, setShowTransposeOptions] = useState(false);
  const [updatingSongStatus, setUpdatingSongStatus] = useState(false);
  const [isDone, setIsDone] = useState(isDoneParam === 'true');
  
  // List of musical keys for transposition
  const musicalKeys = getMusicalKeys();

  // Fetch service details if viewing from a service
  useEffect(() => {
    const fetchServiceInfo = async () => {
      if (!eventId) return;
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select('title, start_time')
          .eq('id', eventId)
          .single();
        
        if (error) throw error;
        setServiceData(data);
      } catch (err) {
        console.error('Error fetching service details:', err);
        // Not critical, so we won't set an error state
      }
    };
    
    fetchServiceInfo();
  }, [eventId]);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        setLoading(true);
        
        const data = await fetchSongById(id);
        
        setSong(data);
        
        // Use service key if provided, otherwise use song's default key
        const keyToUse = serviceKey || data.default_key || 'C';
        setCurrentKey(keyToUse);
        
        // If the service key differs from the song's default key, transpose the chords immediately
        if (serviceKey && data.default_key && serviceKey !== data.default_key && data.chords) {
          const lines = data.chords.split('\n');
          const transposed = lines.map(line => 
            transposeChordLine(line, data.default_key, serviceKey)
          ).join('\n');
          setTransposedChords(transposed);
        } else {
          setTransposedChords(data.chords || '');
        }
      } catch (err) {
        console.error('Error fetching song:', err);
        setError('Could not load the song. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSong();
  }, [id, serviceKey]);

  // Handle key change for transposition
  const handleKeyChange = (newKey) => {
    if (!song || !song.chords) return;
    
    const originalKey = song.default_key || 'C';
    if (newKey === originalKey) {
      // Reset to original chords if returning to original key
      setTransposedChords(song.chords);
      setCurrentKey(newKey);
      return;
    }
    
    // Transpose each line of chords
    const lines = song.chords.split('\n');
    const transposed = lines.map(line => transposeChordLine(line, originalKey, newKey)).join('\n');
    
    setTransposedChords(transposed);
    setCurrentKey(newKey);
  };

  // Handle going back to service
  const handleBackToService = () => {
    if (eventId) {
      navigate(`/services/${eventId}`);
    } else {
      navigate('/songs');
    }
  };

  // Handle toggling the song as done or not done
  const handleToggleSongDone = async () => {
    if (!eventSongId || !eventId) return;
    
    try {
      setUpdatingSongStatus(true);
      
      // Update local state first for immediate feedback
      setIsDone(prevState => !prevState);
      
      // Update the database
      try {
        const { error } = await supabase
          .from('event_songs')
          .update({ 
            is_done: !isDone
          })
          .eq('id', eventSongId);
        
        if (error) {
          console.log('Could not update is_done in database:', error);
          throw error;
        }
        
        // Navigate back to service after successful update
        navigate(`/services/${eventId}`);
      } catch (err) {
        console.log('Error updating is_done field:', err);
        // Revert the local state change on error
        setIsDone(prevState => !prevState);
        throw err;
      }
    } catch (error) {
      console.error('Error updating song status:', error);
      alert('Failed to update song status. Please try again.');
    } finally {
      setUpdatingSongStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={handleBackToService}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="text-center py-12 px-4">
        <p>Song not found.</p>
        <button 
          onClick={handleBackToService}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="pb-[100px] flex flex-col min-h-screen bg-white px-4 md:px-6">
      {/* Back button row */}
      <div className="py-2 border-b border-gray-200">
        <button 
          onClick={handleBackToService}
          className="text-gray-600 flex items-center"
          aria-label="Back"
        >
          <FaArrowLeft className="mr-2" /> 
          <span className="text-sm text-gray-600">Back to Service</span>
        </button>
      </div>
      
      {/* Title row */}
      <div className="py-3 border-b border-gray-200">
        <h1 className="text-xl font-bold">{song.title}</h1>
      </div>
      
      {/* Service context indicator if viewing from a service */}
      {serviceData && (
        <div className="bg-blue-50 py-2 border-b border-blue-100">
          <div className="flex items-center text-sm">
            <FaCalendarCheck className="text-blue-500 mr-2" />
            <span>Viewing for service: </span>
            <span className="text-blue-600 ml-1 font-medium">{serviceData.title}</span>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('song')}
            className={`flex-1 py-2 text-center border-b-2 font-medium text-sm ${
              activeTab === 'song'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
            aria-pressed={activeTab === 'song'}
          >
            <FaMusic className="inline mr-1" />
            Song
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`flex-1 py-2 text-center border-b-2 font-medium text-sm ${
              activeTab === 'attachments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
            aria-pressed={activeTab === 'attachments'}
          >
            <FaPaperclip className="inline mr-1" />
            Attachments
          </button>
        </nav>
      </div>
      
      {activeTab === 'song' ? (
        <div className="flex-1">
          {/* Main content - Chord Chart */}
          {song.chords && (
            <div className="border-b border-gray-200">
              <div className="flex justify-between items-center py-3">
                <h2 className="text-base font-medium flex items-center">
                  <FaMusic className="mr-2" /> 
                  Chord Chart
                </h2>
                
                <button
                  onClick={() => setShowTransposeOptions(!showTransposeOptions)}
                  className="text-blue-600 text-sm"
                  aria-expanded={showTransposeOptions}
                >
                  <FaExchangeAlt className="inline mr-1" /> 
                  Transpose
                </button>
              </div>
              
              {/* Transpose options (conditionally shown) */}
              {showTransposeOptions && (
                <div className="py-3 bg-gray-50 border-y border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <label htmlFor="keySelect" className="block text-xs font-medium text-gray-500 mb-1">
                        Transpose to:
                      </label>
                      <select
                        id="keySelect"
                        value={currentKey}
                        onChange={(e) => handleKeyChange(e.target.value)}
                        className="w-20 px-1 py-1 text-sm border border-gray-300 rounded-md"
                      >
                        {musicalKeys.map((key) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      <div>Original Key: <span className="font-medium">{song.default_key || 'Not set'}</span></div>
                      {currentKey !== song.default_key && (
                        <button
                          onClick={() => handleKeyChange(song.default_key)}
                          className="text-blue-600 underline"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Chord Display */}
              <div className="py-3 overflow-x-auto whitespace-nowrap">
                <ChordDisplay content={transposedChords} />
              </div>
            </div>
          )}
          
          {/* Lyrics */}
          {song.lyrics && (
            <div className="border-b border-gray-200">
              <h2 className="text-base font-medium py-3 border-b border-gray-200">Lyrics</h2>
              <div className="py-3 break-words">
                {song.lyrics.split('\n').map((line, index) => (
                  <div key={index}>{line || <br />}</div>
                ))}
              </div>
            </div>
          )}
          
          {/* Song Metadata in a collapsible section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="flex w-full items-center justify-between py-3 text-left"
              aria-expanded={showMetadata}
            >
              <span className="font-medium">Song Information</span>
              {showMetadata ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            
            {showMetadata && (
              <div className="py-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Artist</p>
                    <p className="font-medium">{song.artist || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Original Key</p>
                    <p className="font-medium">{song.default_key || 'Not specified'}</p>
                  </div>
                  {song.tempo && (
                    <div>
                      <p className="text-xs text-gray-500">Tempo</p>
                      <p className="font-medium">{song.tempo} BPM</p>
                    </div>
                  )}
                </div>
                
                {/* Tags */}
                {song.tags && song.tags.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">Tags</p>
                    <SongTags selectedTags={song.tags} readOnly={true} />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Notes */}
          {song.notes && (
            <div className="border-b border-gray-200">
              <h2 className="text-base font-medium py-3 border-b border-gray-200">Notes</h2>
              <div className="py-3 break-words">
                {song.notes.split('\n').map((line, index) => (
                  <div key={index}>{line || <br />}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-3">
          <SongAttachments songId={id} />
        </div>
      )}
      
      {/* Updated "Mark as Done" button - now sticky, rounded, with more margin at bottom */}
      {eventId && eventSongId && (
        <div className="fixed bottom-16 left-0 right-0 flex justify-center z-20 mb-4">
          <button
            onClick={handleToggleSongDone}
            disabled={updatingSongStatus}
            className="flex items-center justify-center px-6 py-3 bg-green-500 text-white font-medium rounded-full shadow-md hover:bg-green-600 transition-colors max-w-xs"
          >
            <FaCheck className="mr-2" />
            Mark as {isDone ? "Not Done" : "Done"}
          </button>
        </div>
      )}
    </div>
  );
};

export default SongDetail;
