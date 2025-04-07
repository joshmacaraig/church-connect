// src/pages/PrayerRequests.jsx
import { useState, useEffect } from 'react'
import { FaPlus, FaPray, FaHeart } from 'react-icons/fa'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// Add relativeTime plugin to dayjs
dayjs.extend(relativeTime)

const PrayerRequests = () => {
  const [prayerRequests, setPrayerRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'mine', 'others'
  const { user } = useAuth()
  
  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        setLoading(true)
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('church_id')
          .eq('id', user?.id)
          .single()
        
        if (profileData?.church_id) {
          const { data, error } = await supabase
            .from('prayer_requests')
            .select('*')
            .eq('church_id', profileData.church_id)
            .eq('is_private', false)
            .order('created_at', { ascending: false })
          
          if (error) throw error
          
          setPrayerRequests(data || [])
        }
      } catch (error) {
        console.error('Error fetching prayer requests:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPrayers()
  }, [])
  
  // Filter prayer requests
  const filteredPrayers = prayerRequests.filter(prayer => {
    if (filter === 'all') return true
    if (filter === 'mine') return prayer.user_id === user?.id
    if (filter === 'others') return prayer.user_id !== user?.id
    return true
  })
  
  // Prayer button click handler - in a real app, this would update a "prayers" counter
  const handlePrayClick = async (prayerId) => {
    alert(`You prayed for request #${prayerId}. In the full app, this would be recorded.`)
  }
  
  return (
    <div className="space-y-4 pb-16 md:pb-0">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Prayer Requests</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-sm"
          title="Add new prayer request"
        >
          <FaPlus />
        </button>
      </div>
      
      {/* Filter tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Requests
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'mine'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Requests
          </button>
          <button
            onClick={() => setFilter('others')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'others'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Others' Requests
          </button>
        </nav>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Prayer requests list */}
      {!loading && (
        <div className="space-y-4">
          {filteredPrayers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <FaPray className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No prayer requests found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter !== 'all'
                  ? `No ${filter === 'mine' ? 'personal' : 'others'} prayer requests found.`
                  : 'Share your first prayer request with your church community.'}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                  Add Prayer Request
                </button>
              </div>
            </div>
          ) : (
            filteredPrayers.map(prayer => (
              <div key={prayer.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{prayer.title}</h3>
                      <p className="text-sm text-gray-500">
                        {prayer.is_anonymous ? 'Anonymous' : 'User'} • {dayjs(prayer.created_at).fromNow()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-gray-700">
                      {prayer.description}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <button
                      onClick={() => handlePrayClick(prayer.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FaPray className="mr-1" />
                      I Prayed
                    </button>
                    
                    <div className="flex items-center text-gray-500 text-sm">
                      <FaHeart className="text-red-500 mr-1" />
                      <span>12 prayers</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default PrayerRequests
