// src/components/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../layout/Layout'

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Otherwise render the protected content within the layout
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

export default ProtectedRoute
