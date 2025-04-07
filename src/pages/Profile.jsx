import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  ProfileHeader, 
  ProfileInfo, 
  ProfileEditForm, 
  PostsList, 
  ConnectionsList 
} from '../components/profile';

const Profile = () => {
  const { userId } = useParams();
  const { user, updateProfile } = useAuth();
  const currentUserId = user?.id;
  const targetUserId = userId || currentUserId;
  const isCurrentUser = targetUserId === currentUserId;
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeConnectionTab, setActiveConnectionTab] = useState('followers');
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    churchName: '',
    role: '',
    bio: '',
    avatarUrl: '',
    coverUrl: '',
    spiritualGifts: [],
    ministryInterests: []
  });
  
  useEffect(() => {
    fetchProfile();
  }, [targetUserId]);
  
  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Get profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*, churches:church_id(*)')
        .eq('id', targetUserId)
        .single();
      
      if (error) throw error;
      
      // Set form data
      setProfileData({
        fullName: data?.full_name || '',
        email: data?.email || '',
        churchName: data?.churches?.name || '',
        role: data?.user_role || 'member',
        bio: data?.bio || '',
        avatarUrl: data?.avatar_url || '',
        coverUrl: data?.cover_url || '',
        spiritualGifts: data?.spiritual_gifts || [],
        ministryInterests: data?.ministry_interests || []
      });
      
      // Fetch user's posts
      fetchUserPosts(targetUserId);
      
      // Fetch following and followers
      fetchFollowing(targetUserId);
      fetchFollowers(targetUserId);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserPosts = async (userId) => {
    try {
      setLoadingPosts(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Add profile info, reactions counts, and comments count to each post
      const postsWithReactions = await Promise.all(data.map(async (post) => {
        // Get profile info for post owner
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', post.user_id)
          .single();
        
        // Get reactions count
        const { data: reactions, error: reactionsError } = await supabase
          .from('reactions')
          .select('reaction_type, count(*)', { count: 'exact' })
          .eq('post_id', post.id)
          .group('reaction_type');
        
        if (reactionsError) {
          console.error('Error fetching reactions:', reactionsError);
        }
        
        // Get comments count
        const { count: commentsCount, error: commentsError } = await supabase
          .from('comments')
          .select('id', { count: 'exact' })
          .eq('post_id', post.id);
        
        if (commentsError) {
          console.error('Error fetching comments count:', commentsError);
        }
        
        return {
          ...post,
          profile: userProfile || { full_name: profileData.fullName, avatar_url: profileData.avatarUrl },
          reactions: reactions || [],
          commentsCount: commentsCount || 0
        };
      }));
      
      setPosts(postsWithReactions);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };
  
  const fetchFollowing = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id, profiles:following_id(*)')
        .eq('follower_id', userId);
      
      if (error) throw error;
      setFollowing(data || []);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };
  
  const fetchFollowers = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id, profiles:follower_id(*)')
        .eq('following_id', userId);
      
      if (error) throw error;
      setFollowers(data || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      setMessage(null);
      
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.fullName,
          bio: profileData.bio,
          spiritual_gifts: profileData.spiritualGifts,
          ministry_interests: profileData.ministryInterests
        })
        .eq('id', currentUserId);
      
      if (error) throw error;
      
      // Update metadata in auth
      await updateProfile({
        fullName: profileData.fullName
      });
      
      setEditMode(false);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setUpdating(false);
    }
  };
  
  const handleAvatarChange = async (event) => {
    try {
      setUploadingAvatar(true);
      const file = event.target.files[0];
      if (!file) return;
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${currentUserId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', currentUserId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setProfileData(prev => ({ ...prev, avatarUrl: data.publicUrl }));
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: 'Failed to upload avatar' });
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  const handleCoverChange = async (event) => {
    try {
      setUploadingCover(true);
      const file = event.target.files[0];
      if (!file) return;
      
      const fileExt = file.name.split('.').pop();
      const filePath = `covers/${currentUserId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Reusing the avatars bucket for covers
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update profile with new cover URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: data.publicUrl })
        .eq('id', currentUserId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setProfileData(prev => ({ ...prev, coverUrl: data.publicUrl }));
      
    } catch (error) {
      console.error('Error uploading cover:', error);
      setMessage({ type: 'error', text: 'Failed to upload cover image' });
    } finally {
      setUploadingCover(false);
    }
  };
  
  const handleFollowToggle = async (userId) => {
    try {
      // Check if already following
      const { data, error: checkError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (data) {
        // Already following, so unfollow
        const { error: deleteError } = await supabase
          .from('follows')
          .delete()
          .eq('id', data.id);
        
        if (deleteError) throw deleteError;
      } else {
        // Not following, so follow
        const { error: insertError } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: userId
          });
        
        if (insertError) throw insertError;
      }
      
      // Refresh following and followers
      fetchFollowing(targetUserId);
      fetchFollowers(targetUserId);
      
    } catch (error) {
      console.error('Error toggling follow:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update follow status'
      });
    }
  };
  
  // If still loading, show skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }
  
  const spiritualGiftOptions = [
    'Teaching', 'Worship', 'Leadership', 'Service', 'Hospitality', 
    'Prayer', 'Giving', 'Administration', 'Encouragement', 'Evangelism'
  ];
  
  const ministryInterestOptions = [
    'Worship Team', 'Children\'s Ministry', 'Youth Ministry', 'Missions', 
    'Media/Tech', 'Hospitality', 'Prayer Team', 'Small Groups', 'Outreach'
  ];
  
  const stats = {
    posts: posts.length,
    followers: followers.length,
    following: following.length
  };
  
  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <ProfileHeader 
        profile={profileData}
        isCurrentUser={isCurrentUser}
        onAvatarChange={handleAvatarChange}
        onCoverChange={handleCoverChange}
        onEditProfile={() => setEditMode(true)}
        uploadingAvatar={uploadingAvatar}
        uploadingCover={uploadingCover}
        stats={stats}
      />
      
      {/* Profile Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`pb-4 px-1 ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`pb-4 px-1 ${
              activeTab === 'posts'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button
            className={`pb-4 px-1 ${
              activeTab === 'connections'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('connections')}
          >
            Connections
          </button>
        </nav>
      </div>
      
      {/* Message notification */}
      {message && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
      
      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {isCurrentUser && editMode ? (
            <ProfileEditForm 
              profile={profileData}
              onProfileChange={setProfileData}
              onSubmit={handleSubmit}
              onCancel={() => setEditMode(false)}
              updating={updating}
              spiritualGiftOptions={spiritualGiftOptions}
              ministryInterestOptions={ministryInterestOptions}
            />
          ) : (
            <ProfileInfo profile={profileData} />
          )}
        </div>
      )}
      
      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Posts</h2>
            {isCurrentUser && (
              <Link 
                to="/create-post"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                New Post
              </Link>
            )}
          </div>
          
          <PostsList 
            posts={posts} 
            loading={loadingPosts}
            isCurrentUser={isCurrentUser}
          />
        </div>
      )}
      
      {/* Connections Tab */}
      {activeTab === 'connections' && (
        <ConnectionsList 
          followers={followers}
          following={following}
          currentUserId={currentUserId}
          onFollowToggle={handleFollowToggle}
          activeConnectionTab={activeConnectionTab}
          onTabChange={setActiveConnectionTab}
        />
      )}
    </div>
  );
};

export default Profile;
