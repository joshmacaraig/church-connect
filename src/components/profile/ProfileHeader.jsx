import React, { useRef } from 'react';
import { FaUser, FaChurch, FaEdit, FaCamera } from 'react-icons/fa';

const ProfileHeader = ({ 
  profile, 
  isCurrentUser, 
  onAvatarChange, 
  onCoverChange, 
  onEditProfile,
  uploadingAvatar,
  uploadingCover,
  stats
}) => {
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  
  const handleAvatarClick = () => {
    if (isCurrentUser) {
      avatarInputRef.current.click();
    }
  };
  
  const handleCoverClick = () => {
    if (isCurrentUser) {
      coverInputRef.current.click();
    }
  };
  
  return (
    <>
      {/* Cover Photo */}
      <div className="relative h-48 bg-gray-200 rounded-lg overflow-hidden">
        {profile.coverUrl ? (
          <img 
            src={profile.coverUrl} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600" />
        )}
        
        {/* Edit cover button */}
        {isCurrentUser && (
          <>
            <button 
              className="absolute bottom-2 right-2 bg-white bg-opacity-70 p-2 rounded-full"
              onClick={handleCoverClick}
              disabled={uploadingCover}
            >
              <FaCamera className="text-gray-700" />
            </button>
            <input 
              type="file"
              ref={coverInputRef}
              onChange={onCoverChange}
              className="hidden"
              accept="image/*"
            />
          </>
        )}
      </div>
      
      {/* Profile Header */}
      <div className="relative flex flex-col md:flex-row gap-4 -mt-16 md:-mt-12 px-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt={profile.fullName} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                <FaUser className="text-gray-400 text-4xl" />
              </div>
            )}
            
            {/* Edit avatar button */}
            {isCurrentUser && (
              <>
                <button 
                  className="absolute bottom-0 right-0 bg-white bg-opacity-70 p-2 rounded-full shadow"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                >
                  <FaCamera className="text-gray-700" />
                </button>
                <input 
                  type="file"
                  ref={avatarInputRef}
                  onChange={onAvatarChange}
                  className="hidden"
                  accept="image/*"
                />
              </>
            )}
          </div>
        </div>
        
        {/* Profile info */}
        <div className="flex-1 pt-16 md:pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
              <p className="text-gray-600">
                {profile.churchName ? `${profile.churchName} • ` : ''}
                {profile.role === 'member' ? 'Member' : 
                profile.role === 'admin' ? 'Administrator' : 
                profile.role === 'worship_leader' ? 'Worship Leader' : 
                profile.role}
              </p>
            </div>
            
            {isCurrentUser && (
              <div className="mt-2 md:mt-0 space-x-2">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
                  onClick={onEditProfile}
                >
                  <FaEdit className="mr-2" /> Edit Profile
                </button>
              </div>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex mt-4 gap-4 text-center">
            <div className="flex-1">
              <div className="font-bold text-gray-900">{stats.posts}</div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900">{stats.followers}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900">{stats.following}</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileHeader;
