// src/components/layout/Header.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaBars, FaBell, FaSignOutAlt } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'

const Header = () => {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }
  
  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirect handled by protected route
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo & Title */}
        <div className="flex items-center">
          <button 
            className="mr-2 md:hidden text-gray-600"
            onClick={toggleMenu}
          >
            <FaBars className="text-xl" />
          </button>
          <Link to="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-blue-600">Church Connect</span>
          </Link>
        </div>
        
        {/* Right side nav items */}
        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:text-blue-600">
            <FaBell className="text-xl" />
          </button>
          
          <div className="relative">
            <button
              className="flex items-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <Link 
                  to="/settings" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={handleSignOut}
                >
                  <FaSignOutAlt className="mr-2" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
