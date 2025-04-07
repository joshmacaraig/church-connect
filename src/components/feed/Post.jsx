import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, 
  FaRegHeart, 
  FaHeart, 
  FaRegComment, 
  FaPray, 
  FaCalendarAlt,
  FaEllipsisH,
  FaBullhorn
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';

const Post = ({ post, currentUserId }) => {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userReactions, setUserReactions] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  
  // Format the post date
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return new Date(post.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };
  
  const relativeTime = formatRelativeTime(post.created_at);
  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Check if it's a special post type
  const isEvent = post.post_type === 'event';
  const isPrayer = post.post_type === 'prayer';
  const isAnnouncement = post.post_type === 'announcement';
  
  // Calculate total reactions count
  const getTotalReactions = (type) => {
    const reaction = post.reactions?.find(r => r.reaction_type === type);
    return reaction ? parseInt(reaction.count) : 0;
  };
  
  const likesCount = getTotalReactions('like');
  const prayerCount = getTotalReactions('pray');
  const amensCount = getTotalReactions('amen');
  
  // Toggle a reaction
  const toggleReaction = async (type) => {
    if (!currentUserId) return;
    
    try {
      // Call the function to toggle the reaction
      const { data, error } = await supabase.rpc('toggle_post_reaction', {
        post_id_param: post.id,
        user_id_param: currentUserId,
        reaction_type_param: type
      });
      
      if (error) throw error;
      
      // Update the local state with the new reaction status
      setUserReactions(prev => ({
        ...prev,
        [type]: data
      }));
      
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };
  
  // Fetch comments when showComments is true
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);
  
  // Get user name from cache or fallback to user ID
  const getUserInfo = async (userId) => {
    if (!userId) return { full_name: 'Unknown User', avatar_url: null };
    
    // Check if it's the current user
    if (userId === currentUserId) {
      return {
        full_name: localStorage.getItem('userFullName') || 'You',
        avatar_url: localStorage.getItem('userAvatarUrl') || null
      };
    }
    
    // Try to get from cache
    try {
      const usernamesCache = JSON.parse(localStorage.getItem('usernamesCache') || '{}');
      if (usernamesCache[userId]) {
        return { 
          full_name: usernamesCache[userId],
          avatar_url: null // We don't have avatar URLs in the cache
        };
      }
    } catch (err) {
      console.log('Error reading username cache:', err);
    }
    
    return { full_name: 'User', avatar_url: null };
  };
  
  // Fetch comments for the post
  const fetchComments = async () => {
    if (!post.id) return;
    
    try {
      setLoadingComments(true);
      
      // First, get the comments without trying to join with profiles
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setComments([]);
        return;
      }
      
      // Process each comment to add user info
      const processedComments = await Promise.all(data.map(async (comment) => {
        const userInfo = await getUserInfo(comment.user_id);
        return {
          ...comment,
          profiles: userInfo
        };
      }));
      
      setComments(processedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };
  
  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !currentUserId) return;
    
    try {
      setSubmittingComment(true);
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          content: comment.trim()
        })
        .select();
      
      if (error) throw error;
      
      // Add new comment to the list with current user's information
      if (data && data.length > 0) {
        const newComment = {
          ...data[0],
          profiles: {
            full_name: localStorage.getItem('userFullName') || 'You',
            avatar_url: localStorage.getItem('userAvatarUrl') || null
          }
        };
        
        setComments(prev => [...prev, newComment]);
      }
      
      // Clear the comment input
      setComment('');
      
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };
  
  // Function to detect and extract YouTube video IDs from URLs
  // Improved to handle more URL formats
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    // Enhanced regular expression to support more YouTube URL formats
    const regExps = [
      // Standard YouTube URLs (youtube.com/watch?v=VIDEO_ID)
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)/,
      // Short YouTube URLs (youtu.be/VIDEO_ID)
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^\s]+)/,
      // Embedded YouTube URLs (youtube.com/embed/VIDEO_ID)
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^\s]+)/,
      // Youtube.com/v/VIDEO_ID format
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^\s?]+)/,
      // YouTube shorts (youtube.com/shorts/VIDEO_ID)
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^\s?]+)/,
    ];
    
    // Try each regex pattern
    for (const regExp of regExps) {
      const match = url.match(regExp);
      if (match && match[1]) {
        // Return the first 11 characters in case there are additional parameters
        return match[1].substring(0, 11);
      }
    }
    
    return null;
  };
  
  // Function to find YouTube URLs within text
  const findYouTubeUrls = (text) => {
    if (!text) return [];
    
    // Match potential YouTube URLs in the text
    const urlRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/\S+|youtu\.be\/\S+))/gi;
    const matches = text.match(urlRegex);
    
    return matches || [];
  };
  
  // Function to render post content with YouTube embeds
  const renderPostContent = (content) => {
    if (!content) return null;
    
    // Look for YouTube URLs in the content
    const youtubeUrls = findYouTubeUrls(content);
    
    // If no YouTube URLs found, just return the text content
    if (youtubeUrls.length === 0) {
      return <p className="text-gray-800 whitespace-pre-line">{content}</p>;
    }
    
    // If the content is just a YouTube URL (trimmed), show only the embed
    if (youtubeUrls.length === 1 && content.trim() === youtubeUrls[0]) {
      const videoId = getYouTubeVideoId(youtubeUrls[0]);
      if (videoId) {
        return (
          <div>
            <iframe
              width="100%"
              height="300"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-md my-2"
            ></iframe>
          </div>
        );
      }
    }
    
    // For content with both text and YouTube URLs
    // First show the text, then the embeds for each YouTube URL found
    return (
      <div>
        <p className="text-gray-800 whitespace-pre-line mb-3">{content}</p>
        {youtubeUrls.map((url, index) => {
          const videoId = getYouTubeVideoId(url);
          if (!videoId) return null;
          
          return (
            <div key={index} className="my-3">
              <iframe
                width="100%"
                height="300"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={`YouTube video ${index + 1}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-md"
              ></iframe>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Function to render comment content with YouTube embeds
  const renderCommentContent = (content) => {
    if (!content) return null;
    
    // Look for YouTube URLs in the content
    const youtubeUrls = findYouTubeUrls(content);
    
    // If no YouTube URLs found, just return the text content
    if (youtubeUrls.length === 0) {
      return <p className="text-gray-800">{content}</p>;
    }
    
    // If the content is just a YouTube URL (trimmed), show only the embed
    if (youtubeUrls.length === 1 && content.trim() === youtubeUrls[0]) {
      const videoId = getYouTubeVideoId(youtubeUrls[0]);
      if (videoId) {
        return (
          <div className="mt-2">
            <iframe
              width="100%"
              height="195"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-md"
            ></iframe>
          </div>
        );
      }
    }
    
    // For content with both text and YouTube URLs
    // First show the text, then the embeds for each YouTube URL found
    return (
      <div>
        <p className="text-gray-800 mb-2">{content}</p>
        {youtubeUrls.map((url, index) => {
          const videoId = getYouTubeVideoId(url);
          if (!videoId) return null;
          
          return (
            <div key={index} className="mt-2">
              <iframe
                width="100%"
                height="195"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={`YouTube video ${index + 1}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-md"
              ></iframe>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-4">
      {/* Post header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to={`/profile/${post.user_id}`} className="flex items-center">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 mr-3">
              {post.profile?.avatar_url || post.avatar_url ? (
                <img 
                  src={post.profile?.avatar_url || post.avatar_url} 
                  alt={post.profile?.full_name || 'User'} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <FaUser className="text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex items-center">
              <div>
                <h3 className="font-medium">{post.profile?.full_name || 'User'}</h3>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-gray-500">
                    {relativeTime}
                    {post.church?.name && ` • ${post.church.name}`}
                  </p>

                  {/* Post type indicator - Improved badge styling */}
                  {(isEvent || isPrayer || isAnnouncement) && (
                    <span className={`inline-flex items-center px-2 py-0.5 ml-1 text-xs font-medium rounded-full ${
                      isEvent ? 'bg-blue-100 text-blue-700' : 
                      isPrayer ? 'bg-purple-100 text-purple-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isEvent && <FaCalendarAlt className="mr-1 text-xs" />}
                      {isPrayer && <FaPray className="mr-1 text-xs" />}
                      {isAnnouncement && <FaBullhorn className="mr-1 text-xs" />}
                      {isEvent ? 'Event' : isPrayer ? 'Prayer' : 'Announcement'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400" title={formattedDate}>
                  {formattedDate}
                </p>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Post menu */}
        <div className="relative">
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            onClick={() => setShowMenu(!showMenu)}
          >
            <FaEllipsisH />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <div className="py-1">
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowMenu(false)}
                >
                  Save post
                </button>
                {currentUserId === post.user_id && (
                  <>
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      Edit post
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      Delete post
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Post content - Updated to use renderPostContent */}
      <div className="p-4 pt-0">
        {renderPostContent(post.content)}
        
        {/* Media if available */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className={`mt-3 grid ${post.media_urls.length > 1 ? 'grid-cols-2 gap-2' : 'grid-cols-1'}`}>
            {post.media_urls.map((url, i) => (
              <img 
                key={i} 
                src={url} 
                alt={`Post media ${i+1}`}
                className="w-full h-auto rounded-md object-cover"
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Post stats */}
      {(likesCount > 0 || prayerCount > 0 || amensCount > 0 || post.commentsCount > 0) && (
        <div className="px-4 py-2 flex justify-between text-sm text-gray-500 border-t border-gray-100">
          <div>
            {likesCount > 0 && (
              <span className="flex items-center inline-block mr-3">
                <FaHeart className="text-red-500 mr-1" /> {likesCount}
              </span>
            )}
            {prayerCount > 0 && (
              <span className="flex items-center inline-block mr-3">
                <FaPray className="text-purple-500 mr-1" /> {prayerCount}
              </span>
            )}
          </div>
          
          {post.commentsCount > 0 && (
            <button 
              className="hover:underline"
              onClick={() => setShowComments(!showComments)}
            >
              {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}
      
      {/* Post actions - Removed Share button */}
      <div className="px-2 py-2 flex border-t border-gray-100">
        <button 
          className={`flex-1 flex items-center justify-center p-2 rounded-md ${
            userReactions.like ? 'text-red-500 font-medium' : 'text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => toggleReaction('like')}
        >
          {userReactions.like ? <FaHeart className="mr-2" /> : <FaRegHeart className="mr-2" />}
          Like
        </button>
        
        <button 
          className="flex-1 flex items-center justify-center p-2 text-gray-500 hover:bg-gray-50 rounded-md"
          onClick={() => setShowComments(!showComments)}
        >
          <FaRegComment className="mr-2" />
          Comment
        </button>
        
        <button 
          className={`flex-1 flex items-center justify-center p-2 rounded-md ${
            userReactions.pray ? 'text-purple-500 font-medium' : 'text-gray-500 hover:bg-gray-50'
          }`}
          onClick={() => toggleReaction('pray')}
        >
          <FaPray className="mr-2" />
          Pray
        </button>
      </div>
      
      {/* Comments section */}
      {showComments && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          {/* Comment form */}
          {currentUserId && (
            <form onSubmit={handleCommentSubmit} className="mb-4 flex">
              <input
                type="text"
                placeholder="Write a comment..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={submittingComment}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md disabled:opacity-50"
                disabled={!comment.trim() || submittingComment}
              >
                {submittingComment ? 'Sending...' : 'Post'}
              </button>
            </form>
          )}
          
          {/* Comments list */}
          {loadingComments ? (
            <div className="text-center text-gray-500 text-sm py-2">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-2">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex space-x-3">
                  {/* User avatar */}
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {comment.profiles?.avatar_url ? (
                      <img 
                        src={comment.profiles.avatar_url} 
                        alt={comment.profiles.full_name || 'User'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <FaUser className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Comment content */}
                  <div className="flex-1">
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                      <div className="font-medium text-sm">{comment.profiles?.full_name || 'User'}</div>
                      {renderCommentContent(comment.content)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 ml-2">
                      {formatRelativeTime(comment.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Post;
