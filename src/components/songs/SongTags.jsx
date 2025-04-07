// src/components/songs/SongTags.jsx
import { useState, useEffect } from 'react';
import { FaTags, FaPlus, FaTimes } from 'react-icons/fa';
import { fetchSongTags, createSongTag } from '../../lib/songAPI';

/**
 * Component for managing song tags
 */
const SongTags = ({ selectedTags = [], onChange, readOnly = false }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6'); // Default blue
  
  // Load all available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        setLoading(true);
        const data = await fetchSongTags();
        setTags(data);
      } catch (err) {
        console.error('Error loading tags:', err);
        setError('Failed to load tags');
      } finally {
        setLoading(false);
      }
    };
    
    loadTags();
  }, []);
  
  // Toggle tag selection
  const toggleTag = (tag) => {
    if (readOnly) return;
    
    const isSelected = selectedTags.some(t => t.id === tag.id);
    let newSelectedTags;
    
    if (isSelected) {
      newSelectedTags = selectedTags.filter(t => t.id !== tag.id);
    } else {
      newSelectedTags = [...selectedTags, tag];
    }
    
    onChange(newSelectedTags);
  };
  
  // Create new tag
  const handleCreateTag = async (e) => {
    e.preventDefault();
    
    if (!newTagName.trim()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const newTag = await createSongTag({
        name: newTagName.trim(),
        color: newTagColor
      });
      
      setTags([...tags, newTag]);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setShowCreateForm(false);
      
      // Auto-select the new tag
      onChange([...selectedTags, newTag]);
    } catch (err) {
      console.error('Error creating tag:', err);
      setError('Failed to create tag');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && tags.length === 0) {
    return <div className="text-gray-500 text-sm">Loading tags...</div>;
  }
  
  if (error && tags.length === 0) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }
  
  return (
    <div className="song-tags">
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="mb-3">
          <div className="text-sm text-gray-500 mb-1 flex items-center">
            <FaTags className="mr-1" /> Selected Tags:
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map(tag => (
              <div
                key={tag.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: `${tag.color}20`, // Color with 20% opacity
                  color: tag.color,
                  borderColor: tag.color
                }}
              >
                {tag.name}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="ml-1 focus:outline-none"
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!readOnly && (
        <>
          {/* Available tags */}
          <div className="mb-3">
            <div className="text-sm text-gray-500 mb-1">Available Tags:</div>
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => {
                const isSelected = selectedTags.some(t => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      isSelected 
                        ? 'bg-opacity-80 text-white' 
                        : 'bg-opacity-20'
                    }`}
                    style={{ 
                      backgroundColor: isSelected ? tag.color : `${tag.color}20`,
                      color: isSelected ? 'white' : tag.color
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-2 py-1 border border-dashed border-gray-300 rounded-full text-xs font-medium text-gray-500 hover:text-gray-700 hover:border-gray-400"
              >
                <FaPlus className="mr-1" size={10} />
                New Tag
              </button>
            </div>
          </div>
          
          {/* Create tag form */}
          {showCreateForm && (
            <div className="mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Create New Tag</h4>
              <form onSubmit={handleCreateTag} className="space-y-3">
                <div>
                  <label htmlFor="tagName" className="block text-xs text-gray-500">
                    Tag Name
                  </label>
                  <input
                    type="text"
                    id="tagName"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter tag name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="tagColor" className="block text-xs text-gray-500">
                    Tag Color
                  </label>
                  <div className="flex mt-1">
                    <input
                      type="color"
                      id="tagColor"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="h-8 w-8 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="ml-2 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="#HEX"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 border border-transparent rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading || !newTagName.trim()}
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SongTags;
