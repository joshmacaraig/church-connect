// src/components/layout/Layout.jsx
import { useState, useEffect } from 'react'
import Header from './Header'
import BottomNavigation from './BottomNavigation'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex flex-1">
        {/* Sidebar for tablet/desktop */}
        {!isMobile && (
          <Sidebar className="hidden md:block w-64 bg-white shadow-md" />
        )}
        
        {/* Main content */}
        <main className="flex-1 px-4 md:px-6 pt-4 pb-[100px] md:ml-64">
          {children}
        </main>
      </div>
      
      {/* Bottom navigation for mobile */}
      {isMobile && <BottomNavigation />}
    </div>
  )
}

export default Layout
