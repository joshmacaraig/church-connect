# Church Connect - Frontend Component Guide

## Component Philosophy

The Church Connect application follows a component-based architecture using React. Components are designed to be:

- **Reusable**: Components should be generic enough to be used in multiple places
- **Composable**: Smaller components should combine to form larger ones
- **Maintainable**: Components should be easy to understand and modify
- **Testable**: Components should be designed with testing in mind
- **Accessible**: Components should follow accessibility best practices

## Component Categories

### Layout Components

Layout components define the overall structure of the application and pages.

#### `Layout.jsx`

The main layout wrapper that includes the header, navigation, and footer.

```jsx
// Example usage
<Layout>
  <PageContent />
</Layout>
```

#### `Dashboard.jsx`

A layout specific to the dashboard that includes statistics, recent activities, and quick access buttons.

### Navigation Components

#### `Navbar.jsx`

The top navigation bar that includes the app logo, navigation links, and user profile.

#### `Sidebar.jsx`

The sidebar navigation that provides access to the main features of the application.

#### `BottomNav.jsx`

Mobile-specific bottom navigation bar that appears on smaller screens.

### Authentication Components

#### `ProtectedRoute.jsx`

A route wrapper that redirects unauthenticated users to the login page.

```jsx
// Example usage
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

#### `Login.jsx` / `Register.jsx`

Form components for user authentication.

### UI Components

#### `Button.jsx`

A reusable button component with variants for primary, secondary, and tertiary actions.

```jsx
// Example usage
<Button variant="primary" onClick={handleSubmit}>Save</Button>
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>
```

#### `Card.jsx`

A container component used to group related information.

```jsx
// Example usage
<Card>
  <Card.Header>Card Title</Card.Header>
  <Card.Body>Card content goes here</Card.Body>
  <Card.Footer>Footer actions</Card.Footer>
</Card>
```

#### `Modal.jsx`

A dialog component that appears above the page content.

```jsx
// Example usage
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>Modal Title</Modal.Header>
  <Modal.Body>Modal content</Modal.Body>
  <Modal.Footer>
    <Button onClick={onClose}>Close</Button>
  </Modal.Footer>
</Modal>
```

#### `Form Components`

Various form input components that handle validation and error states:

- `Input.jsx` - Text input
- `Select.jsx` - Dropdown select
- `Checkbox.jsx` - Checkbox input
- `RadioGroup.jsx` - Radio button group
- `DatePicker.jsx` - Date selection
- `TimePicker.jsx` - Time selection

```jsx
// Example usage
<Input 
  label="Email" 
  type="email" 
  name="email" 
  error={errors.email?.message} 
  {...register("email", { required: "Email is required" })} 
/>
```

### Feature-Specific Components

#### Calendar Components

- `Calendar.jsx` - Main calendar view
- `EventForm.jsx` - Form for creating/editing events
- `EventDetail.jsx` - Detailed view of an event

#### Worship Team Components

- `TeamList.jsx` - List of worship teams
- `TeamDetail.jsx` - Detailed view of a team
- `SongList.jsx` - List of songs
- `SongDetail.jsx` - Detailed view of a song

#### Prayer Request Components

- `PrayerRequestList.jsx` - List of prayer requests
- `PrayerRequestForm.jsx` - Form for submitting prayer requests
- `PrayerRequestDetail.jsx` - Detailed view of a prayer request

#### Church Components

- `ChurchList.jsx` - List of churches
- `ChurchDetail.jsx` - Detailed view of a church
- `ChurchForm.jsx` - Form for creating/editing churches

## Component Props Interface

Each component should have a clear interface defined with PropTypes or TypeScript.

Example:

```jsx
// Button.jsx
Button.propTypes = {
  children: PropTypes.node.required,
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
}

Button.defaultProps = {
  variant: 'primary',
  size: 'md',
  fullWidth: false,
  disabled: false,
  onClick: () => {},
}
```

## Component State Management

### Local Component State

Use React's `useState` hook for component-specific state:

```jsx
const [isOpen, setIsOpen] = useState(false);
```

### Form State

Use React Hook Form for form state management:

```jsx
const { register, handleSubmit, formState: { errors } } = useForm();
```

### Global State

Use React Context for global state that needs to be accessed across components:

```jsx
// In a component
const { user, signOut } = useAuth();
```

### Server State

Use React Query for server-side state management:

```jsx
// Fetching data
const { data, isLoading, error } = useQuery(['events', churchId], 
  () => fetchEvents(churchId)
);

// Mutations
const mutation = useMutation(createEvent, {
  onSuccess: () => {
    queryClient.invalidateQueries(['events', churchId]);
  }
});
```

## Component Styling

Components use TailwindCSS for styling with these guidelines:

### Class Organization

Classes should be organized in a consistent order:

1. Layout (display, position, etc.)
2. Box model (width, height, margin, padding)
3. Typography (font, text color, etc.)
4. Visual (background, border, etc.)
5. Interactive (hover, focus, etc.)

```jsx
<button className="flex items-center justify-center w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
  Button Text
</button>
```

### Responsive Design

Use Tailwind's responsive modifiers for different screen sizes:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>
```

### Theme Consistency

Use the theme colors and sizing consistently:

- Primary color: blue-600
- Success color: green-500
- Warning color: yellow-500
- Error color: red-600
- Text colors: gray-900 (headings), gray-600 (body)
- Rounding: rounded-md (default), rounded-full (avatars, badges)
- Spacing: Multiples of 4 (tailwind defaults)

## Component Testing

Components should be tested using React Testing Library:

```jsx
// Example test
test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  const buttonElement = screen.getByText(/click me/i);
  expect(buttonElement).toBeInTheDocument();
});
```

## Component Documentation

Each component should be documented with:

1. Purpose and usage
2. Props interface
3. Example usage
4. Edge cases and handling

## Best Practices

1. Keep components focused on a single responsibility
2. Extract reusable logic into custom hooks
3. Use named exports for components
4. Create index.js files for convenient imports
5. Use meaningful component names that reflect their purpose
6. Avoid deeply nested components
7. Use React.memo for performance optimization when appropriate
8. Implement error boundaries for critical components
9. Include accessibility attributes (aria-* attributes, role, etc.)
10. Ensure keyboard navigation works correctly

Following these guidelines will ensure a consistent, maintainable, and high-quality component library for the Church Connect application.
