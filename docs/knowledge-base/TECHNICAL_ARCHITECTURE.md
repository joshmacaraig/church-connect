# Church Connect - Technical Architecture

## Overview

Church Connect is a web application built using modern JavaScript technologies, with a focus on a responsive, mobile-first design. The application follows a client-server architecture where the frontend is decoupled from the backend, communicating via API calls.

## Technology Stack

### Frontend

- **Framework**: React 18.2+ with JSX
- **Build Tool**: Vite 5.0+
- **Styling**: TailwindCSS 3.3+ for utility-first CSS
- **Routing**: React Router 6.20+ for client-side routing
- **State Management**: React Context API for global state, React Query 3.39+ for server state
- **Forms**: React Hook Form 7.48+ for form handling and validation
- **Date/Time**: DayJS 1.11+ for date manipulation and formatting
- **Icons**: React Icons 4.12+ for iconography

### Backend (Supabase)

- **Database**: PostgreSQL (managed by Supabase)
- **Authentication**: Supabase Auth with JWT
- **Storage**: Supabase Storage for file uploads
- **API**: RESTful API provided by Supabase
- **Security**: Row-Level Security (RLS) policies
- **Realtime**: Subscription-based updates (optional)

## Architecture Patterns

### Component-Based Architecture

The frontend is structured around reusable React components, organized by feature and function:

- **Layout Components**: Define the overall structure of the application
- **Feature Components**: Implement specific features
- **UI Components**: Reusable UI elements like buttons, inputs, cards
- **HOCs/Hooks**: Shared functionality and state management

### Container/Presenter Pattern

Many components follow a container/presenter pattern:

- **Containers**: Handle data fetching, state management, and business logic
- **Presenters**: Focus on rendering UI based on props

### Data Flow

1. **User Interactions** trigger events in React components
2. **Event Handlers** update local or global state
3. **React Query / API Calls** interact with the Supabase backend
4. **State Updates** trigger re-renders of affected components
5. **UI Updates** reflect the new state to the user

## Directory Structure

```
church-connect/
├── docs/                  # Documentation files
│   └── knowledge-base/    # Claude knowledge base
├── src/                   # Source code
│   ├── components/        # Reusable components
│   │   ├── auth/          # Authentication components
│   │   ├── layout/        # Layout components
│   │   ├── ui/            # UI elements
│   │   └── feature-specific/ # Feature components
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and services
│   ├── pages/             # Page components
│   └── styles/            # Global styles
├── supabase/              # Supabase configuration
│   ├── migrations/        # Database migrations
│   └── functions/         # Backend utility functions
└── public/                # Static assets
```

## Authentication Flow

1. User submits login or registration form
2. Frontend sends credentials to Supabase Auth
3. Supabase validates credentials and returns JWT
4. JWT is stored in browser (localStorage/sessionStorage)
5. JWT is included in subsequent API requests
6. Supabase RLS policies use JWT to enforce access control

## Data Access Patterns

### Read Operations

1. Component mounts or data refresh is triggered
2. React Query fetches data from Supabase
3. Component renders data from React Query cache
4. React Query handles caching and refetching strategies

### Write Operations

1. User submits form or triggers action
2. Frontend validates input
3. Data is sent to Supabase via API call
4. React Query cache is invalidated or updated
5. UI reflects successful write or displays error

## Error Handling

- Client-side validation using React Hook Form
- API error handling with try/catch blocks
- Global error state for application-wide errors
- Component-level error states for localized errors
- Error boundaries for unexpected runtime errors

## Performance Considerations

- Code splitting via React.lazy and Suspense
- Optimistic UI updates for better perceived performance
- Efficient re-renders with React.memo and useMemo
- Image optimization and lazy loading
- Pagination and infinite scrolling for large datasets

## Security Implementation

- JWT-based authentication
- Row-Level Security policies in Supabase
- Content Security Policy
- Input sanitization and validation
- HTTPS-only communication

## Deployment Architecture

- Static hosting for frontend (e.g., Vercel, Netlify)
- Supabase for backend services
- CDN for asset delivery
- Environment-specific configuration

## Integration Points

- Supabase REST API
- Supabase Realtime (optional)
- External services (if needed)

## Monitoring and Logging

- Client-side error tracking
- Performance monitoring
- Usage analytics

This architecture is designed to be scalable, maintainable, and focused on delivering a smooth user experience across devices, with particular emphasis on mobile usability.
