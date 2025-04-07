# Church Connect - Authentication System

## Overview

The Church Connect authentication system is built on Supabase Auth, providing secure user authentication with email/password credentials. The system includes user registration, login, password recovery, and profile management, along with role-based access control for different church roles.

## Authentication Flow

### Registration Flow

1. User provides their email, password, full name, and optional church name
2. Frontend calls `supabase.auth.signUp()` with email, password, and metadata
3. Supabase creates a new user in the `auth.users` table
4. A trigger automatically creates a profile entry in the `profiles` table
5. Supabase sends an email verification link to the user
6. User clicks the verification link to confirm their email
7. User is redirected to the login page

### Login Flow

1. User enters their email and password
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials and returns a session token
4. Frontend stores the session token and user data
5. User is redirected to the dashboard

### Password Reset Flow

1. User requests password reset via the "Forgot Password" form
2. Frontend calls `supabase.auth.resetPasswordForEmail()`
3. Supabase sends a password reset link to the user's email
4. User clicks the link and is directed to the reset password page
5. User enters their new password
6. Frontend calls `supabase.auth.updatePassword()`
7. User is redirected to login with their new password

## Authentication Components

### AuthContext

The `AuthContext` provides authentication state and methods to the entire application:

```jsx
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        
        setUser(data?.session?.user || null)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Auth methods (signUp, signIn, signOut, resetPassword, etc.)
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
```

### Protected Routes

The `ProtectedRoute` component handles route protection for authenticated content:

```jsx
// src/components/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
```

## User Roles and Permissions

Church Connect implements role-based access control with three primary roles:

### Admin Role

Church administrators have full access to manage their church:
- Create and edit church details
- Manage worship teams
- Create all event types
- Access all prayer requests including private ones
- Assign roles to other users

### Worship Leader Role

Worship team leaders have specialized permissions focused on music and service planning:
- Manage their assigned worship teams
- Create and edit worship services
- Manage the song library
- Create practice events
- View non-private prayer requests

### Member Role

Regular church members have basic access:
- View church events
- View worship teams and song library
- Submit prayer requests
- Access their own profile

## Implementation Details

### Supabase Auth Configuration

Supabase Auth is configured with the following settings:
- Email auth provider enabled
- Email confirmation required
- Custom redirect URL for email actions
- Custom email templates for confirmation and recovery

### User Profile Management

User profiles extend the basic Supabase auth data:
- `profiles` table links to `auth.users` via the `id` field
- Additional user data like full name, role, and church association
- Avatar images stored in the `avatars` bucket

### Church Assignment

Users can be assigned to a church in two ways:
1. During registration by providing a church name
2. By joining an existing church through an invitation or search

### Row Level Security

Row Level Security (RLS) policies enforce access control at the database level:

```sql
-- Example: Prayer request access policy
CREATE POLICY "Users can view non-private prayer requests in their church"
ON public.prayer_requests
FOR SELECT
USING (
  (NOT is_private AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.church_id = prayer_requests.church_id
  ))
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.church_id = prayer_requests.church_id
    AND profiles.user_role = 'admin'
  )
);
```

## Authentication Pages

### Login Page

- Email and password fields
- Remember me option
- Forgot password link
- Link to registration

### Registration Page

- Email, password, and confirm password fields
- Full name field
- Optional church name field
- Terms of service acceptance
- Link to login page

### Forgot Password Page

- Email field for password reset request
- Confirmation message after submission

### Reset Password Page

- New password and confirm password fields
- Validation for password strength
- Confirmation after successful reset

### Verify Email Page

- Instructions for checking email
- Option to resend verification email

## Security Considerations

### Password Policy

- Minimum 8 characters
- Requires mix of upper/lowercase, numbers, and special characters
- Prevents common passwords
- Encourages passphrases

### Session Management

- JWT tokens used for authentication
- Token refreshing handled by Supabase client
- Session persistence options (remember me)
- Automatic session expiration after inactivity

### Data Protection

- Sensitive data never stored in local storage
- HTTPS encryption for all traffic
- Password hashing with bcrypt
- RLS policies to enforce access control

## Error Handling

The authentication system handles various error scenarios:

- Invalid credentials
- Already registered email
- Password mismatch
- Account locked (after multiple failed attempts)
- Network errors
- Expired verification links

## Testing Authentication

To test the authentication system:

1. Create test users with different roles
2. Verify login, logout, and session persistence
3. Test password reset flow
4. Verify email verification process
5. Test role-based access to different features
6. Confirm RLS policies are enforcing correct access

## Related Documentation

- [Supabase Setup Guide](../SUPABASE_SETUP.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
