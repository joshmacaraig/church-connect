import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  FaUser, 
  FaImage, 
  FaVideo,
  FaPray,
  FaCalendarAlt,
  FaBullhorn,
  FaTimes,
  FaSpinner
} from 'react-icons/fa';

const PostComposer = ({ onPostCreated, churchId }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('regular');
  const [media, setMedia] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef();
  
  const handleContentChange = (e) => {
    setContent(e.target.value);
    
    // Auto-expand when typing
    if (!expanded && e.target.value) {
      setExpanded(true);
    }
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Only keep images and videos
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    // Create previews
    const newPreviews = validFiles.map(file => {
      return {
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'video'
      };
    });
    
    setMedia([...media, ...validFiles]);
    setMediaPreview([...mediaPreview, ...newPreviews]);
    setExpanded(true);
  };
  
  const removeMedia = (index) => {
    // Release object URL to prevent memory leaks
    URL.revokeObjectURL(mediaPreview[index].url);
    
    const newMedia = [...media];
    newMedia.splice(index, 1);
    
    const newPreviews = [...mediaPreview];
    newPreviews.splice(index, 1);
    
    setMedia(newMedia);
    setMediaPreview(newPreviews);
  };
  
  const handlePostTypeChange = (type) => {
    setPostType(type);
    setExpanded(true);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && media.length === 0) return;
    
    try {
      setUploading(true);
      
      // Create a post with user metadata included
      const postData = {
        user_id: user.id,
        church_id: churchId,
        content: content.trim(),
        media_urls: [],
        post_type: postType,
      };
      
      const { data: post, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();
      
      if (error) {
        console.error('Post creation error:', error);
        throw error;
      }
      
      console.log('Post created successfully:', post);
      
      // Reset form
      setContent('');
      setMedia([]);
      setMediaPreview([]);
      setPostType('regular');
      setExpanded(false);
      
      if (onPostCreated) {
        onPostCreated(post);
      }
      
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  // Helper for post type button
  const PostTypeButton = ({ type, icon, label, active }) => (
    <button
      type="button"
      className={`flex items-center px-3 py-1.5 rounded-full text-sm ${
        active 
          ? 'bg-blue-100 text-blue-800' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
      onClick={() => handlePostTypeChange(type)}
    >
      {icon}
      <span className="ml-1">{label}</span>
    </button>
  );
  
  // Get profile data from user object
  const { avatar_url, full_name } = user?.user_metadata || {};
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="p-4">
          {/* User info and text area */}
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                {avatar_url ? (
                  <img 
                    src={avatar_url} 
                    alt={full_name} 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <FaUser className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <textarea
                placeholder={`What's on your mind, ${full_name?.split(' ')[0] || 'there'}?`}
                className="w-full border-0 focus:ring-0 text-lg text-gray-700 placeholder-gray-400 bg-transparent resize-none"
                rows={expanded ? 4 : 2}
                value={content}
                onChange={handleContentChange}
                onClick={() => setExpanded(true)}
              />
              
              {/* Media previews */}
              {mediaPreview.length > 0 && (
                <div className={`grid gap-2 mb-3 ${mediaPreview.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {mediaPreview.map((item, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden bg-gray-100">
                      {item.type === 'image' ? (
                        <img 
                          src={item.url} 
                          alt={`Upload preview ${i+1}`}
                          className="w-full h-48 object-cover" 
                        />
                      ) : (
                        <video 
                          src={item.url} 
                          className="w-full h-48 object-cover"
                          controls
                        />
                      )}
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-gray-900 bg-opacity-70 text-white rounded-full p-1"
                        onClick={() => removeMedia(i)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {expanded && (
          <>
            {/* Post types */}
            <div className="px-4 py-2 border-t border-gray-100">
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                <span className="text-sm text-gray-500 whitespace-nowrap">Post type:</span>
                
                <PostTypeButton 
                  type="regular" 
                  icon={<FaUser className="text-blue-500" />} 
                  label="Regular"
                  active={postType === 'regular'} 
                />
                
                <PostTypeButton 
                  type="prayer" 
                  icon={<FaPray className="text-purple-500" />} 
                  label="Prayer Request"
                  active={postType === 'prayer'} 
                />
                
                <PostTypeButton 
                  type="event" 
                  icon={<FaCalendarAlt className="text-green-500" />} 
                  label="Event"
                  active={postType === 'event'} 
                />
                
                {(user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'worship_leader') && (
                  <PostTypeButton 
                    type="announcement" 
                    icon={<FaBullhorn className="text-yellow-500" />} 
                    label="Announcement"
                    active={postType === 'announcement'} 
                  />
                )}
              </div>
            </div>
            
            {/* Media upload buttons */}
            <div className="px-4 py-2 flex items-center justify-between border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="flex items-center text-gray-600 hover:bg-gray-100 rounded-md px-3 py-1.5"
                  onClick={() => fileInputRef.current.click()}
                >
                  <FaImage className="text-green-500 mr-1.5" />
                  <span className="text-sm">Photo</span>
                </button>
                
                <button
                  type="button"
                  className="flex items-center text-gray-600 hover:bg-gray-100 rounded-md px-3 py-1.5"
                  onClick={() => fileInputRef.current.click()}
                >
                  <FaVideo className="text-red-500 mr-1.5" />
                  <span className="text-sm">Video</span>
                </button>
                
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="px-4 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => {
                    setExpanded(false);
                    setContent('');
                    setMedia([]);
                    setMediaPreview([]);
                    setPostType('regular');
                  }}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={uploading || (!content.trim() && media.length === 0)}
                  className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {uploading ? (
                    <>
                      <FaSpinner className="animate-spin mr-1.5" />
                      Posting...
                    </>
                  ) : (
                    'Post'
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default PostComposer;
