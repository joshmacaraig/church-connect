import React from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaRegHeart, FaComments } from 'react-icons/fa';

const PostsList = ({ posts, loading, isCurrentUser }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
        <p className="mt-1 text-gray-500">
          {isCurrentUser 
            ? "You haven't shared any posts yet. Share something with your community!"
            : "This user hasn't shared any posts yet."}
        </p>
        {isCurrentUser && (
          <Link 
            to="/create-post" 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create your first post
          </Link>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {posts.map(post => (
        <div key={post.id} className="bg-white rounded-lg shadow overflow-hidden">
          {/* Post header */}
          <div className="p-4 flex items-center">
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
            <div>
              <h3 className="font-medium">{post.profile?.full_name || 'User'}</h3>
              <p className="text-xs text-gray-500">
                {new Date(post.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          {/* Post content */}
          <div className="p-4 pt-0">
            <p className="text-gray-800">{post.content}</p>
            
            {/* Media if available */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className={`mt-3 grid ${post.media_urls.length > 1 ? 'grid-cols-2 gap-2' : 'grid-cols-1'}`}>
                {post.media_urls.map((url, i) => (
                  <img 
                    key={i} 
                    src={url} 
                    alt={`Post media ${i+1}`}
                    className="w-full h-auto rounded-md"
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Post reactions */}
          <div className="px-4 py-2 border-t border-gray-100 flex justify-between text-sm">
            <div className="flex space-x-4">
              <button className="flex items-center text-gray-500 hover:text-blue-500">
                <FaRegHeart className="mr-1" />
                <span>
                  {post.reactions
                    .filter(r => r.reaction_type === 'like')
                    .reduce((sum, r) => sum + parseInt(r.count), 0) || 0}
                </span>
              </button>
              <button className="flex items-center text-gray-500 hover:text-blue-500">
                <FaComments className="mr-1" />
                <span>{post.commentsCount}</span>
              </button>
            </div>
            <div>
              <Link to={`/posts/${post.id}`} className="text-blue-500">
                View Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostsList;
