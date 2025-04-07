// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom'
import { 
  FaHome, 
  FaCalendarAlt, 
  FaMusic, 
  FaPray, 
  FaUser, 
  FaCog, 
  FaUsers, 
  FaChurch,
  FaMicrophone
} from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'

const Sidebar = ({ className }) => {
  const { user } = useAuth()
  
  // Create menu items
  const menuItems = [
    { path: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
    { path: '/calendar', icon: <FaCalendarAlt />, label: 'Calendar' },
    { path: '/services', icon: <FaMicrophone />, label: 'Services' },
    { path: '/songs', icon: <FaMusic />, label: 'Songs' },
    { path: '/teams', icon: <FaUsers />, label: 'Teams' },
    { path: '/prayer-requests', icon: <FaPray />, label: 'Prayer Requests' },
    { path: '/churches', icon: <FaChurch />, label: 'Churches' },
  ]
  
  const bottomItems = [
    { path: '/profile', icon: <FaUser />, label: 'Profile' },
    { path: '/settings', icon: <FaCog />, label: 'Settings' },
  ]

  return (
    <aside className={`${className} flex flex-col h-[calc(100vh-4rem)] overflow-y-auto fixed`}>
      {/* User section */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
            {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'No email'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Main menu items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      {/* Bottom menu items */}
      <div className="px-2 py-4 space-y-1 border-t">
        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}

export default Sidebar
