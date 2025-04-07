# Building with Claude, React, and Supabase: A Developer's Guide

This guide outlines best practices, workflows, and tips for using Claude to assist with building React applications with Supabase. Based on lessons learned from the Church Connect project, this document will help you set up future projects more efficiently.

## Table of Contents
1. [Initial Project Setup](#initial-project-setup)
2. [Supabase Configuration](#supabase-configuration)
3. [Authentication Implementation](#authentication-implementation)
4. [Database Schema Design](#database-schema-design)
5. [Row Level Security (RLS) Patterns](#row-level-security-rls-patterns)
6. [React Component Strategy](#react-component-strategy)
7. [Effective Claude Prompting](#effective-claude-prompting)
8. [Common Issues and Solutions](#common-issues-and-solutions)
9. [Iterative Development Workflow](#iterative-development-workflow)

## Initial Project Setup

### Project Initialization
```bash
# Initialize a Vite project with React and TypeScript
npm create vite@latest my-app -- --template react-ts

# Navigate to project directory
cd my-app

# Install dependencies
npm install
```

### Essential Dependencies
```bash
# Supabase core dependencies
npm install @supabase/supabase-js

# Routing
npm install react-router-dom

# UI/Styling
npm install tailwindcss postcss autoprefixer
npm install @headlessui/react
npm install react-icons

# Date handling
npm install dayjs

# Form handling
npm install react-hook-form
```

### Project Structure
Organize your project with this recommended structure:
```
src/
├── components/         # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (header, footer, sidebar)
│   └── ui/             # Basic UI components (buttons, inputs, etc.)
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and service connections
│   └── supabase.js     # Supabase client initialization
├── pages/              # Route-level page components
├── styles/             # Global styles and Tailwind configuration
├── types/              # TypeScript type definitions
└── App.jsx             # Main app component with routing setup
```

## Supabase Configuration

### Client Initialization
Create a `lib/supabase.js` file:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Environment Setup
Create `.env` and `.env.example` files:

```
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### API Connection Testing
Use this pattern to test Supabase connectivity:

```javascript
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('your_table')
      .select('count()')
      .single();
      
    if (error) throw error;
    console.log('Connected to Supabase successfully!');
    return true;
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    return false;
  }
};
```

## Authentication Implementation

### Auth Context Setup
Create an `AuthContext.jsx` file:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get session on load
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setUser(session?.user || null);
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setIsAuthenticated(!!session);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Auth functions
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: metadata }
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const updatePassword = async (password) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### Protected Routes Pattern
Create a `ProtectedRoute.jsx` component:

```javascript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise render the protected content within the layout
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;
```

## Database Schema Design

### Migration File Structure
Organize your SQL migrations in a logical order:

```
/supabase
  /migrations
    00_setup_functions.sql
    01_initial_schema.sql
    02_security_policies.sql
    03_storage_setup.sql
    04_feature_specific_tables.sql
```

### Schema Best Practices
1. **Use UUIDs for primary keys**:
   ```sql
   CREATE TABLE public.items (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
     name TEXT NOT NULL,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
   );
   ```

2. **Add timestamp columns** to all tables:
   ```sql
   -- Function to automatically update the updated_at timestamp
   CREATE OR REPLACE FUNCTION update_modified_column()
   RETURNS TRIGGER AS $$
   BEGIN
      NEW.updated_at = now();
      RETURN NEW;
   END;
   $$ language 'plpgsql';

   -- Create triggers for all tables with updated_at column
   CREATE TRIGGER update_items_modtime
     BEFORE UPDATE ON public.items
     FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
   ```

3. **Create proper relationships** between tables with foreign keys.

4. **Verify column existence** before creating RLS policies that reference them.

## Row Level Security (RLS) Patterns

### Avoiding Infinite Recursion
When creating RLS policies for tables with self-references or circular dependencies:

```sql
-- AVOID this pattern - can cause infinite recursion:
CREATE POLICY "Users can view profiles in their church"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles AS viewer 
      WHERE viewer.id = auth.uid() 
      AND viewer.church_id = profiles.church_id
    )
  );

-- USE this pattern instead - prevents recursion:
CREATE OR REPLACE FUNCTION get_user_church_id() 
RETURNS UUID 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT church_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE POLICY "Users can view church member profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR
    get_user_church_id() = profiles.church_id
  );
```

### Basic Policies Template

```sql
-- Basic table creation with RLS
CREATE TABLE public.items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users can view their own items"
  ON public.items
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can create items"
  ON public.items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users can update their own items"
  ON public.items
  FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can delete their own items"
  ON public.items
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Using Database Views for Better Performance
Create views to simplify complex joins:

```sql
-- Create a view that joins posts with profile data
CREATE OR REPLACE VIEW public.posts_with_authors AS
SELECT 
  p.*,
  pr.full_name,
  pr.avatar_url,
  c.name as church_name
FROM 
  public.posts p
LEFT JOIN 
  public.profiles pr ON p.user_id = pr.id
LEFT JOIN
  public.churches c ON p.church_id = c.id;

-- Grant access to the view
GRANT SELECT ON public.posts_with_authors TO authenticated;
```

## React Component Strategy

### Component Organization
Structure your components with these patterns:

1. **Container/Presenter Pattern**:
   ```jsx
   // Container component manages data fetching and state
   const UserListContainer = () => {
     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       const fetchUsers = async () => {
         // Fetch data from Supabase
       };
       fetchUsers();
     }, []);
     
     return <UserList users={users} loading={loading} />;
   };
   
   // Presenter component handles rendering
   const UserList = ({ users, loading }) => {
     if (loading) return <div>Loading...</div>;
     
     return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {users.map(user => (
           <UserCard key={user.id} user={user} />
         ))}
       </div>
     );
   };
   ```

2. **Custom Hooks for Data Fetching**:
   ```jsx
   // Custom hook for fetching users
   const useUsers = (churchId) => {
     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);
     
     useEffect(() => {
       const fetchUsers = async () => {
         try {
           const { data, error } = await supabase
             .from('profiles')
             .select('*')
             .eq('church_id', churchId);
             
           if (error) throw error;
           setUsers(data || []);
         } catch (err) {
           setError(err.message);
         } finally {
           setLoading(false);
         }
       };
       
       fetchUsers();
     }, [churchId]);
     
     return { users, loading, error };
   };
   
   // Using the hook in a component
   const ChurchMembers = ({ churchId }) => {
     const { users, loading, error } = useUsers(churchId);
     
     // Render component using the data
   };
   ```

3. **Error Boundary Pattern**:
   ```jsx
   class ErrorBoundary extends React.Component {
     constructor(props) {
       super(props);
       this.state = { hasError: false, error: null };
     }
   
     static getDerivedStateFromError(error) {
       return { hasError: true, error };
     }
   
     render() {
       if (this.state.hasError) {
         return this.props.fallback || <div>Something went wrong.</div>;
       }
   
       return this.props.children;
     }
   }
   
   // Usage
   <ErrorBoundary fallback={<p>Failed to load user data</p>}>
     <UserProfile userId="123" />
   </ErrorBoundary>
   ```

### Caching Strategies
Implement effective caching to reduce database queries:

```jsx
// Simple cache for user data in localStorage
const getUserData = async (userId) => {
  // Check if cached data exists and is not expired
  const cachedData = localStorage.getItem(`user_${userId}`);
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    // Cache valid for 5 minutes
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
  }
  
  // Fetch from Supabase if no cache or expired
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  
  // Cache the result
  localStorage.setItem(`user_${userId}`, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
  
  return data;
};
```

## Effective Claude Prompting

### Project Setup Prompts
When starting a new project, provide Claude with detailed information about your requirements:

```
I'm building a React application with Supabase that will [describe your app]. 
I want to use the following tech stack:
- React with TypeScript
- Vite for build tools
- Supabase for backend
- Tailwind CSS for styling
- React Router for navigation

Can you help me set up the initial project structure, particularly:
1. Project initialization commands
2. Folder structure
3. Authentication setup with Supabase
4. Basic components structure
```

### Database Schema Design Prompts
When designing your database schema:

```
I need to design a database schema for a [describe your application] using Supabase with PostgreSQL.

The main entities include:
- [Entity 1] with attributes: [list attributes]
- [Entity 2] with attributes: [list attributes]
- [Relationship between entities]

Please provide:
1. SQL migration scripts to create these tables
2. RLS (Row Level Security) policies to secure the data
3. Necessary functions and triggers
4. Indexes for optimal performance
```

### Component Implementation Prompts
When asking Claude to help with component implementations:

```
I need to create a [component name] component that shows [describe functionality].

The component should:
- Accept these props: [list props]
- Have these state variables: [list state]
- Fetch data from Supabase table [table name]
- Handle these user interactions: [list interactions]
- Have responsive design for mobile and desktop

Context: This component will be used in [describe where it fits in the app].

The styling should use Tailwind CSS and match our app's design system.
```

### Debugging Prompts
When you encounter issues, provide Claude with clear context:

```
I'm encountering an error with my Supabase RLS policies. Here's the specific error message:

[Error message]

The relevant schema and policies are:

[Code snippets]

I've tried:
1. [Approach 1]
2. [Approach 2]

What might be causing this issue, and how can I fix it?
```

## Common Issues and Solutions

### RLS Policy Issues

**Issue**: Infinite recursion in RLS policies

**Solution**: Use helper functions to break circular references:

```sql
-- Create a function to isolate the logic
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID) 
RETURNS TEXT 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_role FROM public.profiles WHERE id = user_id
$$;

-- Use the function in the policy
CREATE POLICY "Only admins can delete items"
  ON public.items
  FOR DELETE
  USING (get_user_role(auth.uid()) = 'admin');
```

### React-Supabase Integration Issues

**Issue**: Components re-rendering too often when fetching data

**Solution**: Implement proper dependency arrays and caching:

```jsx
// Problem:
useEffect(() => {
  fetchData(); // Runs on every render if no dependency array
});

// Solution:
useEffect(() => {
  fetchData();
}, []); // Empty array = run once on mount

// With dependencies:
useEffect(() => {
  fetchData(userId);
}, [userId]); // Re-runs only when userId changes
```

### Authentication Issues

**Issue**: Users getting logged out unexpectedly

**Solution**: Implement proper token refresh handling:

```javascript
// In your AuthProvider
useEffect(() => {
  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) console.error('Error refreshing session:', error);
  };

  // Refresh session on page load
  refreshSession();

  // Set up interval to refresh session
  const interval = setInterval(refreshSession, 1000 * 60 * 60); // Every hour
  
  return () => clearInterval(interval);
}, []);
```

## Iterative Development Workflow

### Best Practices for Working with Claude

1. **Start with skeleton components**:
   Ask Claude to generate basic skeleton components first, then gradually add complexity.

2. **Break down complex features**:
   Instead of asking for an entire feature at once, break it down into smaller components and integrations.

3. **Share error messages promptly**:
   When you encounter errors, share them with Claude right away with full context for better assistance.

4. **Iterate on database schema**:
   Begin with a minimal viable schema and add complexity as you develop features.

5. **Save common patterns**:
   Create a library of reusable code snippets and patterns that Claude has helped you develop.

### Development Checklist

For each feature you implement:

- [ ] Define data models and relationships
- [ ] Create database migrations
- [ ] Set up RLS policies
- [ ] Implement React components (container and presentational)
- [ ] Add error handling and loading states
- [ ] Test functionality across different user roles
- [ ] Optimize queries and component rendering
- [ ] Add responsive design adjustments
- [ ] Document the feature

### Documentation Standards

For each component or feature:

```jsx
/**
 * ComponentName - Brief description
 * 
 * @component
 * @example
 * <ComponentName propA={value} propB={value} />
 * 
 * @prop {string} propA - Description of propA
 * @prop {number} propB - Description of propB
 * @prop {function} onEvent - Called when event occurs
 */
```

For database schemas:

```sql
-- Table: items
-- Description: Stores user-created items with various properties
-- Relationships:
--   - Belongs to one user (user_id)
--   - Has many tags (through item_tags)
CREATE TABLE public.items (
  -- Primary identifier for the item
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Creation and modification timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Core properties
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Use check constraints for data validation
  CONSTRAINT name_length CHECK (char_length(name) >= 3)
);
```

By following these guidelines, you'll be able to effectively leverage Claude to build robust React applications with Supabase while avoiding common pitfalls and maximizing productivity.
