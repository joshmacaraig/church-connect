import React from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaUserPlus, FaUserMinus } from 'react-icons/fa';

const ConnectionItem = ({ connection, currentUserId, onFollowToggle }) => {
  // Extract user data based on if it's a follower or following
  const userData = connection.profiles || connection;
  const userId = connection.follower_id || connection.following_id;
  
  // Determine if current user follows this person
  const isFollowing = false; // This would need to be determined by checking against your following list
  
  return (
    <div className="flex items-center justify-between p-3 border-b">
      <Link to={`/profile/${userId}`} className="flex items-center">
        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 mr-3 flex-shrink-0">
          {userData.avatar_url ? (
            <img 
              src={userData.avatar_url} 
              alt={userData.full_name} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <FaUser className="text-gray-400" />
            </div>
          )}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{userData.full_name}</h3>
          {userData.church_id && (
            <p className="text-xs text-gray-500">{userData.church_name || "Church Member"}</p>
          )}
        </div>
      </Link>
      
      {userId !== currentUserId && (
        <button 
          onClick={() => onFollowToggle(userId)}
          className={`flex items-center px-3 py-1 rounded-md text-sm ${
            isFollowing 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isFollowing ? (
            <>
              <FaUserMinus className="mr-1" />
              Unfollow
            </>
          ) : (
            <>
              <FaUserPlus className="mr-1" />
              Follow
            </>
          )}
        </button>
      )}
    </div>
  );
};

const ConnectionsList = ({ 
  followers, 
  following, 
  currentUserId,
  onFollowToggle,
  activeConnectionTab = 'followers' 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex space-x-4 border-b">
        <button 
          className={`pb-2 px-4 ${
            activeConnectionTab === 'followers' 
              ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
              : 'text-gray-500'
          }`}
        >
          Followers
        </button>
        <button 
          className={`pb-2 px-4 ${
            activeConnectionTab === 'following' 
              ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
              : 'text-gray-500'
          }`}
        >
          Following
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {activeConnectionTab === 'followers' ? (
          followers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No followers yet
            </div>
          ) : (
            <div>
              {followers.map(follower => (
                <ConnectionItem 
                  key={follower.follower_id} 
                  connection={follower} 
                  currentUserId={currentUserId}
                  onFollowToggle={onFollowToggle}
                />
              ))}
            </div>
          )
        ) : (
          following.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Not following anyone yet
            </div>
          ) : (
            <div>
              {following.map(followed => (
                <ConnectionItem 
                  key={followed.following_id} 
                  connection={followed} 
                  currentUserId={currentUserId}
                  onFollowToggle={onFollowToggle}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ConnectionsList;
