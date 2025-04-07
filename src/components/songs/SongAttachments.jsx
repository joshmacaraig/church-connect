// src/components/songs/SongAttachments.jsx
import { useState, useEffect, useRef } from 'react';
import { FaFileAlt, FaMusic, FaFileAudio, FaPlus, FaTrash, FaDownload } from 'react-icons/fa';
import { uploadSongAttachment, listSongAttachments, deleteSongAttachment } from '../../lib/songAPI';

/**
 * Component for managing song attachments
 */
const SongAttachments = ({ songId, readOnly = false }) => {
  const [attachments, setAttachments] = useState({
    'chord-charts': [],
    'sheet-music': [],
    'backing-tracks': []
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const [selectedType, setSelectedType] = useState(null);
  
  // Attachment type options for the UI
  const attachmentTypes = [
    { value: 'chord-charts', label: 'Chord Charts', icon: <FaFileAlt /> },
    { value: 'sheet-music', label: 'Sheet Music', icon: <FaMusic /> },
    { value: 'backing-tracks', label: 'Backing Tracks', icon: <FaFileAudio /> }
  ];
  
  // Load attachments
  useEffect(() => {
    const loadAttachments = async () => {
      if (!songId) return;
      
      try {
        setLoading(true);
        const data = await listSongAttachments(songId);
        setAttachments(data);
      } catch (err) {
        console.error('Error loading attachments:', err);
        setError('Failed to load attachments');
      } finally {
        setLoading(false);
      }
    };
    
    loadAttachments();
  }, [songId]);
  
  // Handle file upload
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    
    if (!file || !selectedType) {
      return;
    }
    
    try {
      setUploading(true);
      
      await uploadSongAttachment(songId, file, selectedType);
      
      // Refresh the list
      const data = await listSongAttachments(songId);
      setAttachments(data);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
      setSelectedType(null);
    }
  };
  
  // Handle file deletion
  const handleDelete = async (type, fileName) => {
    try {
      await deleteSongAttachment(songId, type, fileName);
      
      // Update local state to remove the file
      setAttachments(prev => ({
        ...prev,
        [type]: prev[type].filter(file => file.name !== fileName)
      }));
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file');
    }
  };
  
  // Trigger file input click when type is selected
  const selectFileType = (type) => {
    setSelectedType(type);
    
    // Small delay to ensure state is updated
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 100);
  };
  
  // Helper function to render file icon based on file type
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FaFileAlt className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FaFileAlt className="text-blue-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <FaFileAlt className="text-green-500" />;
      case 'mp3':
      case 'wav':
      case 'm4a':
        return <FaFileAudio className="text-purple-500" />;
      default:
        return <FaFileAlt className="text-gray-500" />;
    }
  };
  
  if (loading) {
    return <div className="text-gray-500 text-sm">Loading attachments...</div>;
  }
  
  // Check if there are any attachments
  const hasAttachments = Object.values(attachments).some(files => files.length > 0);
  
  return (
    <div className="song-attachments">
      {error && (
        <div className="mb-3 text-sm text-red-500">{error}</div>
      )}
      
      {/* File upload input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />
      
      {/* Upload controls */}
      {!readOnly && (
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">Add Attachment:</div>
          <div className="flex flex-wrap gap-2">
            {attachmentTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => selectFileType(type.value)}
                disabled={uploading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {uploading && selectedType === type.value ? (
                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-gray-500 rounded-full"></span>
                ) : (
                  <>
                    {type.icon}
                    <FaPlus className="ml-1 mr-1" size={10} />
                  </>
                )}
                {type.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Attachments display */}
      {hasAttachments ? (
        <div className="space-y-4">
          {attachmentTypes.map(type => {
            const files = attachments[type.value] || [];
            if (files.length === 0) return null;
            
            return (
              <div key={type.value} className="attachment-section">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  {type.icon}
                  <span className="ml-2">{type.label}</span>
                  <span className="ml-2 text-xs text-gray-500">({files.length})</span>
                </h4>
                
                <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                  {files.map(file => (
                    <li key={file.name} className="px-4 py-3 bg-white flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center">
                        {getFileIcon(file.name)}
                        <span className="ml-2 text-sm text-gray-600 truncate max-w-xs">
                          {file.name}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <a
                          href={file.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                          title="Download"
                        >
                          <FaDownload />
                        </a>
                        
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleDelete(type.value, file.name)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500 p-4 bg-gray-50 text-center rounded-md">
          No attachments available for this song.
          {!readOnly && (
            <p className="mt-1 text-xs">
              Use the buttons above to add chord charts, sheet music, or backing tracks.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SongAttachments;
