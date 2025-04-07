# Church Connect - Development Guidelines

## Development Approach

When building the Church Connect application, follow these key guidelines and best practices to ensure quality, maintainability, and efficient development.

## 1. Development Workflow

### Branch Strategy

Use a feature branch workflow:

1. Create a branch for each feature or bugfix
2. Use descriptive branch names (e.g., `feature/church-creation`, `fix/login-validation`)
3. Keep branches small and focused on a single feature or fix
4. Regularly merge/rebase from main to avoid drift
5. Use pull requests for code review before merging

### Commit Style

Follow conventional commits for clear history:

```
feat: add church creation form
fix: correct validation in login form
refactor: improve calendar rendering logic
docs: update API documentation
style: fix button alignment
test: add tests for prayer request component
```

### Development Cycle

1. **Plan**: Clearly define requirements before coding
2. **Code**: Implement the feature with tests
3. **Review**: Self-review your code before submitting
4. **Test**: Ensure all tests pass and manually test the feature
5. **Refine**: Address feedback and make improvements
6. **Document**: Update relevant documentation
7. **Merge**: Integrate into the main codebase

## 2. Code Organization

### Directory Structure

Organize code by feature and type:

```
src/
├── components/
│   ├── auth/            # Authentication components
│   ├── calendar/        # Calendar components
│   ├── church/          # Church management components
│   ├── layout/          # Layout components
│   ├── prayer/          # Prayer request components
│   ├── ui/              # Reusable UI components
│   └── worship/         # Worship team components
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
│   ├── api/             # API functions
│   ├── helpers/         # Helper utilities
│   └── supabase.js      # Supabase client
├── pages/               # Page components
└── styles/              # Global styles
```

### Component Structure

For each component, follow a consistent structure:

```jsx
// imports (grouped by type)
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from 'react-query';

// custom hooks/utilities
import { useSomething } from '../../hooks/useSomething';
import { formatSomething } from '../../lib/helpers';

// component definition
const ComponentName = ({ prop1, prop2 }) => {
  // state and hooks
  const [state, setState] = useState(initialState);
  
  // derived state
  const derivedValue = useMemo(() => {
    return complexCalculation(state);
  }, [state]);
  
  // side effects
  useEffect(() => {
    // effect code
    return () => {
      // cleanup
    };
  }, [dependencies]);
  
  // event handlers
  const handleSomething = () => {
    // handler code
  };
  
  // conditional rendering
  if (condition) {
    return <AlternateView />;
  }
  
  // main render
  return (
    <div>
      Component content
    </div>
  );
};

// prop types
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

// default props
ComponentName.defaultProps = {
  prop2: 0,
};

export default ComponentName;
```

## 3. State Management

### Local State

- Use `useState` for component-specific state
- Keep state as local as possible
- Split complex state into multiple useState calls
- Use initializer functions for expensive calculations

```jsx
const [isOpen, setIsOpen] = useState(false);
const [count, setCount] = useState(() => computeInitialCount());
```

### Context API

- Use for global state (authentication, theme, etc.)
- Keep contexts focused on specific domains
- Provide a custom hook for each context

```jsx
// Usage
const { user, signOut } = useAuth();
const { isDarkMode, toggleTheme } = useTheme();
```

### React Query

- Use for all server state and API calls
- Implement proper cache invalidation
- Use stale-while-revalidate pattern
- Set appropriate stale times based on data volatility

```jsx
const { data, isLoading, error } = useQuery(
  ['events', churchId, month],
  () => fetchEvents(churchId, month),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => handleApiError(error)
  }
);
```

### Form State

- Use React Hook Form for form state
- Implement client-side validation
- Provide clear error messages
- Use controlled components when needed

```jsx
const { register, handleSubmit, formState: { errors } } = useForm({
  defaultValues: {
    name: '',
    email: '',
  },
  resolver: yupResolver(schema)
});
```

## 4. Component Design

### Component Sizing

- Keep components small and focused
- Break complex components into smaller ones
- Aim for 150-200 lines maximum per component
- Extract repetitive patterns into shared components

### Composition over Props

- Use component composition for flexibility
- Avoid prop drilling by using composition
- Use children, render props, or custom hooks

```jsx
// Composition
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>

// Instead of prop drilling
<Card title="Title" content="Content" footer="Actions" />
```

### Performance Optimization

- Use React.memo for expensive components
- Optimize renders with useMemo and useCallback
- Use virtualization for long lists
- Lazy load components and routes

```jsx
// Lazy loading routes
const Calendar = React.lazy(() => import('./pages/Calendar'));

// Component optimization
const ExpensiveComponent = React.memo(({ data }) => {
  // Render
});
```

## 5. Styling Approach

### TailwindCSS

- Use Tailwind for most styling needs
- Follow consistent class ordering
- Extract repeated patterns to components
- Use theme customization for brand colors

```jsx
// Class organization: layout, sizing, spacing, typography, colors, states
<button className="flex items-center justify-center w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">
  Submit
</button>
```

### Component Library

- Build a component library for UI consistency
- Document variants and props
- Include accessibility considerations
- Test components in isolation

```jsx
// Button variations
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
```

### Responsive Design

- Use mobile-first approach
- Test on various screen sizes
- Utilize Tailwind breakpoints consistently
- Consider touch inputs for mobile

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

## 6. API Integration

### Data Fetching

- Centralize API calls in dedicated files
- Use React Query for data fetching and caching
- Handle loading and error states consistently
- Implement retry logic for network failures

```jsx
// API function
export const fetchEvents = async (churchId, month) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', churchId)
    .gte('start_time', month.startOf('month').toISOString())
    .lte('start_time', month.endOf('month').toISOString());
  
  if (error) throw error;
  return data;
};

// Component usage
const EventList = ({ churchId, month }) => {
  const { data, isLoading, error } = useQuery(
    ['events', churchId, month],
    () => fetchEvents(churchId, month)
  );
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {data.map(event => (
        <EventItem key={event.id} event={event} />
      ))}
    </div>
  );
};
```

### Error Handling

- Implement global error handling
- Provide user-friendly error messages
- Log errors for debugging
- Handle different types of errors appropriately

```jsx
try {
  await createChurch(churchData);
  toast.success('Church created successfully!');
} catch (error) {
  console.error('Error creating church:', error);
  
  if (error.code === 'PGRST116') {
    toast.error('You do not have permission to create a church');
  } else {
    toast.error('Failed to create church. Please try again.');
  }
}
```

## 7. Testing Strategy

### Component Testing

- Use React Testing Library for component tests
- Test user interactions and behavior
- Focus on user-centric tests
- Mock API calls and context providers

```jsx
test('shows error message when login fails', async () => {
  // Mock failed login
  supabase.auth.signInWithPassword.mockRejectedValue(new Error('Invalid credentials'));
  
  render(<Login />);
  
  // Fill form
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
  
  // Submit form
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  
  // Check for error message
  expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
});
```

### Hook Testing

- Test custom hooks with renderHook
- Verify state changes and side effects
- Test edge cases and error scenarios

```jsx
test('useChurch returns church data and loading state', async () => {
  // Mock API response
  const mockChurch = { id: '123', name: 'Test Church' };
  supabase.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: mockChurch, error: null })
      })
    })
  });
  
  const { result, waitForNextUpdate } = renderHook(() => useChurch('123'));
  
  expect(result.current.isLoading).toBe(true);
  
  await waitForNextUpdate();
  
  expect(result.current.isLoading).toBe(false);
  expect(result.current.church).toEqual(mockChurch);
});
```

### Unit Testing

- Test utility functions and helpers
- Focus on edge cases and input validation
- Use Jest for assertions and mocking

```jsx
test('formatDate correctly formats ISO string', () => {
  const date = '2023-06-15T14:30:00Z';
  expect(formatDate(date, 'short')).toBe('Jun 15');
  expect(formatDate(date, 'long')).toBe('June 15, 2023');
  expect(formatDate(date, 'time')).toBe('2:30 PM');
  expect(formatDate(null)).toBe('');
});
```

### E2E Testing (Optional)

- Use Cypress for critical user flows
- Test the most important user journeys
- Focus on happy paths and critical error scenarios

```jsx
describe('Church Creation Flow', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password');
  });
  
  it('allows user to create a new church', () => {
    cy.visit('/churches/new');
    cy.get('input[name="name"]').type('Test Church');
    cy.get('input[name="location"]').type('New York');
    cy.get('textarea[name="description"]').type('A church for testing');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.contains('Test Church').should('be.visible');
  });
});
```

## 8. Documentation

### Code Documentation

- Add JSDoc comments for functions and components
- Document complex logic and business rules
- Keep comments updated when code changes
- Use TypeScript or PropTypes for type documentation

```jsx
/**
 * Formats a date string according to the specified format
 * @param {string} dateString - ISO date string
 * @param {('short'|'long'|'time')} format - Desired output format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, format = 'short') => {
  if (!dateString) return '';
  
  const date = dayjs(dateString);
  
  switch (format) {
    case 'short':
      return date.format('MMM D');
    case 'long':
      return date.format('MMMM D, YYYY');
    case 'time':
      return date.format('h:mm A');
    default:
      return date.format('MMM D, YYYY');
  }
};
```

### Feature Documentation

- Document feature requirements and behavior
- Include user flows and edge cases
- Keep documentation up-to-date with implementation
- Use the knowledge base for comprehensive documentation

### API Documentation

- Document all API functions
- Include parameters, return values, and errors
- Provide usage examples
- Update when API changes

## 9. Performance Considerations

### Bundle Optimization

- Use code splitting for route-based chunks
- Lazy load heavy components and libraries
- Optimize dependencies and avoid duplicates
- Analyze bundle size regularly

### Render Performance

- Prevent unnecessary re-renders
- Use React.memo and useMemo appropriately
- Keep component trees shallow
- Use virtualization for long lists

### Network Optimization

- Implement proper caching strategies
- Batch API requests when possible
- Use optimistic UI updates
- Handle offline scenarios gracefully

## 10. Accessibility

### Core Guidelines

- Ensure keyboard navigation works
- Maintain proper heading hierarchy
- Use semantic HTML elements
- Provide alternative text for images

### ARIA Attributes

- Add ARIA roles where appropriate
- Use aria-label for elements without visible text
- Implement aria-expanded for toggles
- Ensure screen readers can understand the UI

```jsx
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  onClick={toggleDialog}
>
  <CloseIcon />
</button>
```

### Focus Management

- Trap focus in modals and dialogs
- Return focus after interactions
- Make focus visible for keyboard users
- Handle dynamic content focus properly

## 11. Deployment Strategy

### Environment Configuration

- Use environment variables for configuration
- Keep secrets out of the codebase
- Have different configs for dev/staging/prod
- Document required environment variables

```
# .env.example
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_VERSION=$npm_package_version
```

### Build Process

- Automate builds with CI/CD pipelines
- Run tests before deployment
- Use staging environments for verification
- Implement feature flags for phased rollouts

### Monitoring

- Add error tracking (e.g., Sentry)
- Set up performance monitoring
- Log critical events and errors
- Implement user feedback mechanisms

## 12. Collaboration Best Practices

### Code Reviews

- Review code before merging
- Focus on readability and maintainability
- Look for security issues and edge cases
- Be constructive and collaborative

### Knowledge Sharing

- Document complex implementations
- Share lessons learned and best practices
- Use pair programming for complex features
- Keep the knowledge base updated

### Technical Debt

- Document technical debt when created
- Allocate time to address debt regularly
- Refactor gradually rather than all at once
- Prioritize debt that impacts user experience

## 13. Building the User Interface

### Progressive Enhancement

Start with basic functionality and enhance iteratively:

1. Begin with core functionality that works for all users
2. Add progressive enhancements for modern browsers
3. Implement performance optimizations
4. Add animations and polish

### Mobile-First Development

- Design and implement for mobile first
- Add breakpoints for larger screens
- Test on actual mobile devices
- Consider touch interactions vs. mouse

### UI Component Hierarchy

Build UI components in this order:

1. **Atoms**: Basic building blocks (buttons, inputs)
2. **Molecules**: Groups of atoms (search box, form fields)
3. **Organisms**: Complex UI sections (navigation, forms)
4. **Templates**: Page layouts without real content
5. **Pages**: Complete pages with real content

### Iterative Approach

For each feature:

1. Build minimally viable version
2. Test with users
3. Refine based on feedback
4. Enhance and optimize
5. Document final implementation

Following these guidelines will help the Church Connect application maintain high quality, consistency, and developer productivity throughout the development process.
