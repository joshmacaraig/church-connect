// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Auth Pages
// import Login from './pages/auth/Login'
import Login from './pages/auth/LoginAlternative'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'

// Protected Pages
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Songs from './pages/Songs'
import Services from './pages/Services'
import Profile from './pages/Profile'
import PrayerRequests from './pages/PrayerRequests'
import Churches from './pages/Churches'

// Song Management Components
import SongDetail from './components/songs/SongDetail'
import SongForm from './components/songs/SongForm'

// Service Management Components
import ServiceDetail from './components/events/ServiceDetail'
import ServiceForm from './components/events/ServiceForm'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            
            {/* Song Routes */}
            <Route path="/songs" element={<Songs />} />
            <Route path="/songs/:id" element={<SongDetail />} />
            <Route path="/songs/new" element={<SongForm />} />
            <Route path="/songs/edit/:id" element={<SongForm />} />
            
            {/* Service Routes */}
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/services/new" element={<ServiceForm />} />
            <Route path="/services/edit/:id" element={<ServiceForm />} />
            
            <Route path="/profile" element={<Profile />} />
            <Route path="/prayer-requests" element={<PrayerRequests />} />
            <Route path="/churches" element={<Churches />} />
          </Route>
          
          {/* Redirect root to login or dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 Route */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-screen">
              <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
              <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
              <button 
                onClick={() => window.history.back()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
