// src/pages/Churches.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaChurch, FaPlus, FaSpinner } from 'react-icons/fa';

const Churches = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  
  // Create church state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChurch, setNewChurch] = useState({
    name: '',
    location: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);
  
  // Check if user already has a church
  useEffect(() => {
    const checkUserChurch = async () => {
      try {
        // First try to get from localStorage for quicker response
        const localChurchId = localStorage.getItem('userChurchId');
        
        if (localChurchId) {
          // User already has a church, confirm with database and redirect
          const { data: church } = await supabase
            .from('churches')
            .select('name')
            .eq('id', localChurchId)
            .single();
            
          if (church) {
            navigate('/dashboard');
            return;
          }
        }
        
        // If not in localStorage or church not found, check profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('church_id')
          .eq('id', user.id)
          .single();
          
        if (!error && profile?.church_id) {
          // User already has a church, save to localStorage and redirect
          localStorage.setItem('userChurchId', profile.church_id);
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking user church:', error);
      }
    };
    
    checkUserChurch();
  }, [user, navigate]);
  
  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('churches')
        .select('*');
      
      // Search by name
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setChurches(data || []);
      setSearchPerformed(true);
    } catch (error) {
      console.error('Error searching churches:', error);
      setError('Failed to search churches. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle join church
  const handleJoinChurch = async (churchId) => {
    setJoining(true);
    setError(null);
    
    try {
      // Get church details to show in confirmation
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .select('name')
        .eq('id', churchId)
        .single();
      
      if (churchError) throw churchError;
      
      // Update user's profile with the church ID
      const { error } = await supabase
        .from('profiles')
        .update({ church_id: churchId })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Save in localStorage for immediate use
      localStorage.setItem('userChurchId', churchId);
      
      // Show success message before redirecting
      setError(null);
      alert(`You've successfully joined ${church.name}!`);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error joining church:', error);
      setError('Failed to join church. Please try again.');
      setJoining(false);
    }
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewChurch({ ...newChurch, [name]: value });
  };
  
  // Handle create church
  const handleCreateChurch = async (e) => {
    e.preventDefault();
    
    if (!newChurch.name) {
      setError('Church name is required');
      return;
    }
    
    setCreating(true);
    setError(null);
    
    try {
      // Set user as admin since they're creating the church
      const userRole = 'admin';
    
      // Create new church
      const { data: churchData, error: churchError } = await supabase
        .from('churches')
        .insert([
          {
            name: newChurch.name,
            location: newChurch.location,
            description: newChurch.description,
            created_by: user.id
          }
        ])
        .select()
        .single();
      
      if (churchError) throw churchError;
      
      // Update user's profile with the new church ID and admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          church_id: churchData.id,
          user_role: userRole
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // Save in localStorage for immediate use
      localStorage.setItem('userChurchId', churchData.id);
      
      // Show success message before redirecting
      setError(null);
      alert(`You've successfully created ${churchData.name}!`);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating church:', error);
      setError('Failed to create church. Please try again.');
    } finally {
      setCreating(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Find or Create a Church</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Search for your church</h2>
          <p className="text-gray-600 text-sm mt-1">
            Enter the name of your church to find and join it
          </p>
        </div>
        
        <div className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by church name"
                className="pl-10 pr-4 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? <FaSpinner className="animate-spin" /> : 'Search'}
            </button>
          </form>
          
          {searchPerformed && (
            <div className="mt-4">
              {churches.length === 0 ? (
                <div className="text-center py-6">
                  <FaChurch className="text-gray-400 text-4xl mx-auto mb-2" />
                  <p className="text-gray-600">No churches found matching "{searchQuery}"</p>
                  <button
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center mx-auto"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <FaPlus className="mr-1" />
                    Create your church
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    {churches.length} {churches.length === 1 ? 'church' : 'churches'} found
                  </h3>
                  <div className="space-y-3">
                    {churches.map((church) => (
                      <div key={church.id} className="border rounded-md p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{church.name}</h4>
                            {church.location && (
                              <div className="text-gray-600 text-sm">
                                {church.location}
                              </div>
                            )}
                          </div>
                          <button
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            onClick={() => handleJoinChurch(church.id)}
                            disabled={joining}
                          >
                            {joining ? 'Joining...' : 'Join'}
                          </button>
                        </div>
                        {church.description && (
                          <div className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {church.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-gray-600 text-sm">
                      Don't see your church?
                    </p>
                    <button
                      className="mt-1 text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center mx-auto"
                      onClick={() => setShowCreateForm(true)}
                    >
                      <FaPlus className="mr-1" />
                      Create your church
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Create Church Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Create a new church</h2>
            <p className="text-gray-600 text-sm mt-1">
              Fill out the form below to create your church
            </p>
          </div>
          
          <div className="p-4">
            <form onSubmit={handleCreateChurch}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Church Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newChurch.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newChurch.location}
                    onChange={handleInputChange}
                    placeholder="City, State or full address"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newChurch.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of your church"
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Church'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Churches;
