// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaCalendarAlt, FaMusic, FaPray, FaUsers, FaChurch } from 'react-icons/fa'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// Extend dayjs with plugins
dayjs.extend(relativeTime)
import { Feed } from '../components/feed'

const Dashboard = () => {
  const { user } = useAuth()
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [recentSongs, setRecentSongs] = useState([])
  const [recentPrayers, setRecentPrayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [churchInfo, setChurchInfo] = useState(null)
  const [churchId, setChurchId] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
      setLoading(true)
      
      // WORKAROUND: Due to RLS policy issues with profiles table causing infinite recursion
      // Store churchId in localStorage for immediate use in session
      const localChurchId = localStorage.getItem('userChurchId')
      
      // Only query profiles if we don't have cached data
      if (!localChurchId) {
      try {
          // Get church info for current user
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
          .select('church_id')
          .eq('id', user.id)
          .single()
                
              if (profileError) {
                console.error('Profile error:', profileError)
              } else if (profileData?.church_id) {
                setChurchId(profileData.church_id)
                localStorage.setItem('userChurchId', profileData.church_id)
              }
            } catch (profileQueryError) {
              console.error('Error querying profiles:', profileQueryError)
            }
          } else {
            setChurchId(localChurchId)
          }
          
          // If we have a churchId from either localStorage or query
          if (churchId || localChurchId) {
            const churchIdToUse = churchId || localChurchId
            
            // Get church details
            // Get church details
            const { data: churchData, error: churchError } = await supabase
              .from('churches')
              .select('*')
              .eq('id', churchIdToUse)
              .single()
            
            if (churchError) {
              console.error('Church error:', churchError)
            } else {
              setChurchInfo(churchData)
            }
            
            // Get upcoming events
            const now = dayjs().toISOString()
            const future = dayjs().add(7, 'day').toISOString()
            
            const { data: eventData, error: eventError } = await supabase
              .from('events')
              .select('*')
              .eq('church_id', churchIdToUse)
              .gte('start_time', now)
              .lte('start_time', future)
              .order('start_time', { ascending: true })
              .limit(5)
            
            if (eventError) {
              console.error('Event error:', eventError)
            } else {
              setUpcomingEvents(eventData || [])
            }
            
            // Get recent songs
            const { data: songData, error: songError } = await supabase
              .from('songs')
              .select('*')
              .eq('church_id', churchIdToUse)
              .order('created_at', { ascending: false })
              .limit(5)
            
            if (songError) {
              console.error('Song error:', songError)
            } else {
              setRecentSongs(songData || [])
            }
            
            // Get recent prayer requests
            const { data: prayerData, error: prayerError } = await supabase
              .from('prayer_requests')
              .select('*')
              .eq('church_id', churchIdToUse)
              .eq('is_private', false)
              .order('created_at', { ascending: false })
              .limit(5)
            
            if (prayerError) {
              console.error('Prayer error:', prayerError)
            } else {
              setRecentPrayers(prayerData || [])
            }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [user?.id])

  // If still loading, show skeleton
  if (loading) {
    return (
      <div className="space-y-6 pt-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {churchInfo && (
          <p className="text-gray-600">{churchInfo.name}</p>
        )}
        {!churchInfo && (
          <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700">
              You're not connected to a church yet. Join or create one to access all features.
            </p>
            <Link 
              to="/churches" 
              className="mt-3 inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <FaChurch className="mr-2" />
              Find or Create a Church
            </Link>
          </div>
        )}
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              to="/calendar" 
              className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <FaCalendarAlt className="text-3xl text-blue-600 mb-3" />
              <span className="text-sm font-medium text-gray-900">Calendar</span>
            </Link>
            
            <Link 
              to="/songs" 
              className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <FaMusic className="text-3xl text-blue-600 mb-3" />
              <span className="text-sm font-medium text-gray-900">Songs</span>
            </Link>
            
            <Link 
              to="/prayer-requests" 
              className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <FaPray className="text-3xl text-blue-600 mb-3" />
              <span className="text-sm font-medium text-gray-900">Prayer</span>
            </Link>
            
            <Link 
              to="/teams" 
              className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <FaUsers className="text-3xl text-blue-600 mb-3" />
              <span className="text-sm font-medium text-gray-900">Teams</span>
            </Link>
          </div>
          
          {/* Feed */}
          <Feed currentUserId={user.id} churchId={churchId} />
        </div>
        
        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Upcoming events */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Events</h2>
              <Link to="/calendar" className="text-sm text-blue-600 font-medium">
                View all →
              </Link>
            </div>
            
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming events in the next 7 days</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-start p-3 border border-gray-100 rounded-md hover:bg-gray-50">
                    <div className="min-w-[60px] text-center">
                      <div className="font-bold text-gray-900">{dayjs(event.start_time).format('MMM')}</div>
                      <div className="text-2xl font-bold text-blue-600">{dayjs(event.start_time).format('DD')}</div>
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-500">
                        {dayjs(event.start_time).format('h:mm A')} - {dayjs(event.end_time).format('h:mm A')}
                      </div>
                      {event.location && (
                        <div className="text-sm text-gray-500">{event.location}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Recent prayer requests */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Prayer Requests</h2>
              <Link to="/prayer-requests" className="text-sm text-blue-600 font-medium">
                View all →
              </Link>
            </div>
            
            {recentPrayers.length === 0 ? (
              <p className="text-gray-500 text-sm">No prayer requests yet</p>
            ) : (
              <div className="space-y-3">
                {recentPrayers.map(prayer => (
                  <div key={prayer.id} className="p-3 border-b last:border-0">
                    <div className="font-medium text-gray-900">{prayer.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-2">
                      {prayer.description}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {prayer.is_anonymous ? 'Anonymous' : 'User'} • {dayjs(prayer.created_at).fromNow()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Recent songs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Songs</h2>
              <Link to="/songs" className="text-sm text-blue-600 font-medium">
                View all →
              </Link>
            </div>
            
            {recentSongs.length === 0 ? (
              <p className="text-gray-500 text-sm">No songs added yet</p>
            ) : (
              <div className="space-y-3">
                {recentSongs.map(song => (
                  <div key={song.id} className="flex items-center p-3 border-b last:border-0">
                    <FaMusic className="text-blue-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">{song.title}</div>
                      {song.artist && (
                        <div className="text-sm text-gray-500">{song.artist}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
