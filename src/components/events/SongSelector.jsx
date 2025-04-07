// src/components/events/SongSelector.jsx
import { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaArrowUp, FaArrowDown, FaTimes, FaMusic } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';

const SongSelector = ({ selectedSongs = [], onSongsChange, churchId }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSongSelector, setShowSongSelector] = useState(false);
  
  // Fetch available songs
  useEffect(() => {
    const fetchSongs = async () => {
      if (!churchId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('songs')
          .select('id, title, artist, default_key')
          .eq('church_id', churchId)
          .order('title');
        
        if (error) throw error;
        
        setSongs(data || []);
      } catch (error) {
        console.error('Error fetching songs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSongs();
  }, [churchId]);
  
  // Filter songs that haven't been selected yet
  const availableSongs = songs.filter(song => 
    !selectedSongs.some(selected => selected.songId === song.id)
  );
  
  // Filter songs based on search query
  const filteredSongs = availableSongs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.artist && song.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleAddSong = (song) => {
    const newSong = {
      songId: song.id,
      title: song.title,
      artist: song.artist,
      key: song.default_key || '',
      notes: '',
      order: selectedSongs.length + 1
    };
    
    onSongsChange([...selectedSongs, newSong]);
    setSearchQuery('');
    setShowSongSelector(false);
  };
  
  const handleRemoveSong = (index) => {
    const newSongs = [...selectedSongs];
    newSongs.splice(index, 1);
    
    // Update order for remaining songs
    const reorderedSongs = newSongs.map((song, idx) => ({
      ...song,
      order: idx + 1
    }));
    
    onSongsChange(reorderedSongs);
  };
  
  const handleMoveSong = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === selectedSongs.length - 1)
    ) {
      return; // Can't move further
    }
    
    const newSongs = [...selectedSongs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap songs
    [newSongs[index], newSongs[targetIndex]] = [newSongs[targetIndex], newSongs[index]];
    
    // Update order values
    const reorderedSongs = newSongs.map((song, idx) => ({
      ...song,
      order: idx + 1
    }));
    
    onSongsChange(reorderedSongs);
  };
  
  const handleKeyChange = (index, value) => {
    const newSongs = [...selectedSongs];
    newSongs[index].key = value;
    onSongsChange(newSongs);
  };
  
  const handleNotesChange = (index, value) => {
    const newSongs = [...selectedSongs];
    newSongs[index].notes = value;
    onSongsChange(newSongs);
  };
  
  return (
    <div>
      {/* Selected Songs List */}
      {selectedSongs.length > 0 ? (
        <div className="space-y-4 mb-4">
          {selectedSongs.map((song, index) => (
            <div key={index} className="border rounded-md p-3 bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{index + 1}. {song.title}</h3>
                  {song.artist && <p className="text-sm text-gray-500">{song.artist}</p>}
                </div>
                
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => handleMoveSong(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <FaArrowUp size={14} />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleMoveSong(index, 'down')}
                    disabled={index === selectedSongs.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <FaArrowDown size={14} />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveSong(index)}
                    className="p-1 rounded hover:bg-gray-200 text-red-500"
                    title="Remove song"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">
                    Performance Key
                  </label>
                  <input
                    type="text"
                    value={song.key || ''}
                    onChange={(e) => handleKeyChange(index, e.target.value)}
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Key"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500">
                    Performance Notes
                  </label>
                  <input
                    type="text"
                    value={song.notes || ''}
                    onChange={(e) => handleNotesChange(index, e.target.value)}
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Notes"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-md mb-4">
          <FaMusic className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No songs added</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add songs to your service from your song library
          </p>
        </div>
      )}
      
      {/* Add Song Button or Search Box */}
      {!showSongSelector ? (
        <button
          type="button"
          onClick={() => setShowSongSelector(true)}
          disabled={!churchId}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <FaPlus className="mr-2" /> Add Song
        </button>
      ) : (
        <div className="space-y-3 border p-3 rounded-md">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Add Song to Service</h3>
            <button
              type="button"
              onClick={() => setShowSongSelector(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <FaTimes />
            </button>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search songs by title or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Loading state */}
          {loading && (
            <div className="flex justify-center py-5">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {/* Song selection list */}
          {!loading && (
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {filteredSongs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {availableSongs.length === 0 
                    ? 'No songs available. Add songs to your library first.'
                    : 'No songs matching your search criteria.'}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredSongs.map(song => (
                    <li 
                      key={song.id} 
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAddSong(song)}
                    >
                      <div>
                        <h4 className="font-medium">{song.title}</h4>
                        {song.artist && (
                          <p className="text-sm text-gray-500">{song.artist}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SongSelector;
