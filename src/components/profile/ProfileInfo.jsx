import React from 'react';
import { FaEnvelope, FaChurch, FaPray, FaUsers } from 'react-icons/fa';

const ProfileInfo = ({ profile }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6 space-y-6">
        {profile.bio ? (
          <div>
            <h3 className="text-lg font-medium text-gray-900">About</h3>
            <p className="mt-1 text-gray-600">{profile.bio}</p>
          </div>
        ) : null}
        
        <div>
          <h3 className="text-lg font-medium text-gray-900">Spiritual Gifts</h3>
          {profile.spiritualGifts && profile.spiritualGifts.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.spiritualGifts.map(gift => (
                <span 
                  key={gift} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  <FaPray className="mr-1 h-3 w-3" />
                  {gift}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-gray-500 text-sm">No spiritual gifts added yet</p>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900">Ministry Interests</h3>
          {profile.ministryInterests && profile.ministryInterests.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.ministryInterests.map(interest => (
                <span 
                  key={interest} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  <FaUsers className="mr-1 h-3 w-3" />
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-gray-500 text-sm">No ministry interests added yet</p>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900">Contact</h3>
          <div className="mt-2">
            <div className="flex items-center">
              <FaEnvelope className="text-gray-400 mr-2" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center mt-2">
              <FaChurch className="text-gray-400 mr-2" />
              <span>{profile.churchName || 'No church joined yet'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;
