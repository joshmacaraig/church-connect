# Frontend Setup Guide

This guide will walk you through setting up the frontend React application for Church Connect.

## Prerequisites

- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher)
- Git

## Initial Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd church-connect
```

2. **Install dependencies**

```bash
# Navigate to the project root
npm install
```

3. **Configure environment variables**

Create a `.env` file in the project root with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_url` and `your_supabase_anon_key` with your actual Supabase credentials from the Supabase dashboard.

4. **Start the development server**

```bash
npm run dev
```

The application should now be running at `http://localhost:5173`

## Project Structure

```
src/
├── components/            # Reusable components
│   ├── layout/           
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── Sidebar.jsx
│   │   └── Navigation.jsx
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   ├── PasswordReset.jsx
│   │   └── ProfileForm.jsx
│   ├── calendar/
│   │   ├── Calendar.jsx
│   │   ├── EventForm.jsx
│   │   ├── EventDetail.jsx
│   │   └── SongSelection.jsx
│   ├── worship/
│   ├── prayer/
│   └── ui/               # Reusable UI components
├── pages/                # Page components
│   ├── AuthPages/
│   ├── Dashboard.jsx
│   ├── Calendar.jsx
│   └── ...
├── context/             # React context for global state
│   ├── AuthContext.jsx
│   └── ...
├── hooks/              # Custom hooks
│   ├── useAuth.js
│   ├── useSupabase.js
│   └── ...
├── lib/                # Utility functions
│   ├── supabase.js     # Supabase client
│   └── ...
├── styles/            # Global styles
│   └── globals.css    # TailwindCSS imports
├── App.jsx
└── main.jsx
```

## Authentication Implementation

The auth flow involves three main components:

1. **Supabase Client Setup (`src/lib/supabase.js`)**

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

2. **Auth Context (`src/context/AuthContext.jsx`)**

This provides authentication state and methods to the entire app:

```javascript
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Check for session on mount
  useEffect(() => {
    // Implementation details...
  }, [])
  
  // Auth methods (signIn, signUp, signOut, etc.)
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
```

3. **Protected Routes**

To protect routes that require authentication:

```javascript
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!isAuthenticated) return <Navigate to="/login" />
  
  return children
}
```

## Mobile-First Design Principles

Follow these guidelines for mobile-first development:

1. **Use responsive TailwindCSS classes**
   - Start with mobile design: `w-full`, `px-4`, etc.
   - Add responsive modifiers for larger screens: `md:w-1/2`, `lg:flex`

2. **Touch-friendly elements**
   - Minimum tap target size: 44px × 44px
   - Adequate spacing between interactive elements

3. **Simplified navigation**
   - Use bottom navigation bar for primary actions on mobile
   - Expand to sidebar/top nav on larger screens

4. **Form design**
   - Single column layouts on mobile
   - Larger input fields for touch input
   - Form validation with clear error messages

## Calendar Feature Implementation

The calendar feature requires:

1. **Calendar View Component**
   - Monthly, quarterly, and yearly views
   - Event indicators
   - Navigation between time periods

2. **Event Management**
   - Create/edit event forms
   - Recurrence settings
   - Team assignments

3. **Song Selection Interface**
   - Search and filter functionality
   - Drag-and-drop ordering
   - Key and arrangement notes

## Build and Deployment

To build the project for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory, ready for deployment to your hosting service of choice.

## Troubleshooting

Common issues and solutions:

- **Authentication issues**: Verify your Supabase URL and anon key
- **Styling problems**: Check TailwindCSS configuration
- **Build errors**: Make sure all dependencies are installed correctly

For more help, check the Supabase and React documentation.
