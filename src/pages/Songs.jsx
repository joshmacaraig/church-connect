// src/pages/Songs.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPlus, FaSearch, FaMusic, FaEye, FaEdit } from 'react-icons/fa'
import { supabase } from '../lib/supabase'

const Songs = () => {
  const navigate = useNavigate()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .order('title', { ascending: true })
        
        if (error) throw error
        
        setSongs(data || [])
      } catch (error) {
        console.error('Error fetching songs:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSongs()
  }, [])
  
  // Filter songs based on search query
  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.artist && song.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  
  const handleAddSong = () => {
    navigate('/songs/new')
  }
  
  const handleViewSong = (id) => {
    navigate(`/songs/${id}`)
  }
  
  const handleEditSong = (id, e) => {
    e.stopPropagation() // Prevent triggering the view song action
    navigate(`/songs/edit/${id}`)
  }
  
  return (
    <div className="space-y-4 pb-16 md:pb-0">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Songs</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-sm"
          title="Add new song"
          onClick={handleAddSong}
        >
          <FaPlus />
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
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Songs list */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredSongs.length === 0 ? (
            <div className="p-6 text-center">
              <FaMusic className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No songs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'No songs match your search criteria.' : 'Get started by adding a new song.'}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleAddSong}
                >
                  <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                  Add Song
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredSongs.map(song => (
                <li 
                  key={song.id} 
                  className="px-4 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewSong(song.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{song.title}</h3>
                      {song.artist && (
                        <p className="text-sm text-gray-500">{song.artist}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      {song.default_key && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Key: {song.default_key}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleViewSong(song.id)}
                        className="text-gray-500 hover:text-blue-600"
                        title="View song"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={(e) => handleEditSong(song.id, e)}
                        className="text-gray-500 hover:text-blue-600"
                        title="Edit song"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default Songs
