// src/components/songs/SongForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaTrash, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { getMusicalKeys } from '../../lib/chordTransposer';
import { fetchSongById, createSong, updateSong, deleteSong } from '../../lib/songAPI';
import ChordEditor from './ChordEditor';
import ChordDisplay from './ChordDisplay';
import SongTags from './SongTags';

const SongForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    default_key: 'C',
    tempo: '',
    lyrics: '',
    chords: '',
    notes: '',
    tags: []
  });
  const [showChordPreview, setShowChordPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // List of musical keys for the dropdown
  const musicalKeys = getMusicalKeys();
  
  useEffect(() => {
    if (isEditing) {
      fetchSong();
    }
  }, [id]);
  
  const fetchSong = async () => {
    try {
      setLoading(true);
      
      const data = await fetchSongById(id);
      
      // Populate form with existing data
      setFormData({
        title: data.title || '',
        artist: data.artist || '',
        default_key: data.default_key || 'C',
        tempo: data.tempo || '',
        lyrics: data.lyrics || '',
        chords: data.chords || '',
        notes: data.notes || '',
        tags: data.tags || []
      });
      
      // Show chord preview if there are chords
      if (data.chords) {
        setShowChordPreview(true);
      }
    } catch (err) {
      console.error('Error fetching song:', err);
      setError('Could not load the song. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Song title is required';
    }
    
    if (formData.chords && !formData.default_key) {
      errors.default_key = 'Default key is required when providing chords';
    }
    
    if (formData.tempo && (isNaN(formData.tempo) || formData.tempo < 20 || formData.tempo > 300)) {
      errors.tempo = 'Tempo must be a number between 20 and 300';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field if it exists
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleChordChange = (value) => {
    setFormData(prev => ({
      ...prev,
      chords: value
    }));
  };
  
  const handleTagsChange = (tags) => {
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };
  
  const toggleChordPreview = () => {
    setShowChordPreview(!showChordPreview);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Process form data to handle empty strings for numeric fields
      const processedFormData = {
        ...formData,
        // Convert empty tempo string to null to prevent database type error
        tempo: formData.tempo === '' ? null : Number(formData.tempo)
      };
      
      // Use API functions for CRUD operations
      if (isEditing) {
        await updateSong(id, processedFormData);
        navigate(`/songs/${id}`);
      } else {
        const newSong = await createSong(processedFormData);
        navigate(`/songs/${newSong.id}`);
      }
    } catch (err) {
      console.error('Error saving song:', err);
      setError(err.message || 'Failed to save the song. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!isEditing) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this song? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      setSaving(true);
      
      await deleteSong(id);
      navigate('/songs');
    } catch (err) {
      console.error('Error deleting song:', err);
      setError('Failed to delete the song. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(isEditing ? `/songs/${id}` : '/songs')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft className="mr-1" /> Back
        </button>
        
        <h1 className="text-2xl font-bold text-center flex-1 mx-4">
          {isEditing ? 'Edit Song' : 'Add New Song'}
        </h1>
        
        {isEditing && (
          <button 
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800"
            title="Delete song"
            disabled={saving}
          >
            <FaTrash size={20} />
          </button>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`mt-1 block w-full border ${validationErrors.title ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {validationErrors.title && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
              )}
            </div>
            
            {/* Artist */}
            <div>
              <label htmlFor="artist" className="block text-sm font-medium text-gray-700">
                Artist / Composer
              </label>
              <input
                type="text"
                id="artist"
                name="artist"
                value={formData.artist}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            {/* Key */}
            <div>
              <label htmlFor="default_key" className="block text-sm font-medium text-gray-700">
                Default Key {formData.chords && <span className="text-red-500">*</span>}
              </label>
              <select
                id="default_key"
                name="default_key"
                value={formData.default_key}
                onChange={handleChange}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${validationErrors.default_key ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
              >
                <option value="">Select a key</option>
                {musicalKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              {validationErrors.default_key && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.default_key}</p>
              )}
            </div>
            
            {/* Tempo */}
            <div>
              <label htmlFor="tempo" className="block text-sm font-medium text-gray-700">
                Tempo (BPM)
              </label>
              <input
                type="number"
                id="tempo"
                name="tempo"
                value={formData.tempo}
                onChange={handleChange}
                min="20"
                max="300"
                className={`mt-1 block w-full border ${validationErrors.tempo ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {validationErrors.tempo ? (
                <p className="mt-1 text-sm text-red-600">{validationErrors.tempo}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Typical range: 60-180 BPM</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Tags Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Tags</h2>
          <SongTags 
            selectedTags={formData.tags} 
            onChange={handleTagsChange} 
          />
        </div>
        
        {/* Chords Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Chord Chart</h2>
            {formData.chords && (
              <button
                type="button"
                onClick={toggleChordPreview}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                {showChordPreview ? (
                  <>
                    <FaEyeSlash className="mr-1" /> Hide Preview
                  </>
                ) : (
                  <>
                    <FaEye className="mr-1" /> Show Preview
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Chord Preview */}
          {showChordPreview && formData.chords && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Preview:</h3>
              <ChordDisplay content={formData.chords} />
            </div>
          )}
          
          {/* Chord Editor */}
          <ChordEditor 
            value={formData.chords} 
            onChange={handleChordChange}
            rows={10}
          />
        </div>
        
        {/* Lyrics Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Lyrics</h2>
          <textarea
            id="lyrics"
            name="lyrics"
            value={formData.lyrics}
            onChange={handleChange}
            rows={15}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter lyrics here..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Tip: Include section markers like [Verse], [Chorus], etc. for better organization.
          </p>
        </div>
        
        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Additional Notes</h2>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter any additional notes, performance instructions, etc."
          />
          <p className="mt-1 text-xs text-gray-500">
            Include notes about song structure, performance tips, or arrangement details.
          </p>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {saving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" /> Save Song
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SongForm;
