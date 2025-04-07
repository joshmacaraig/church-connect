# Church Connect - Common Workflows

This document outlines the key user workflows in the Church Connect application, providing a clear understanding of how users will interact with the system.

## User Authentication Workflows

### User Registration Workflow

1. **Access Registration**
   - User navigates to "/register"
   - System displays registration form

2. **Submit Registration**
   - User enters email, password, full name
   - System validates input:
     - Email format is valid
     - Password meets complexity requirements
     - Name is provided
   - System creates user account in Supabase
   - System creates user profile record (via database trigger)

3. **Email Verification**
   - System sends verification email
   - User clicks verification link
   - System marks email as verified

4. **Church Selection**
   - System prompts user to create or join a church
   - If creating: User fills church creation form
   - If joining: User searches and selects existing church
   - System associates user with selected church

5. **Profile Completion**
   - User completes optional profile information
   - System saves profile information
   - System redirects to dashboard

### User Login Workflow

1. **Access Login**
   - User navigates to "/login"
   - System displays login form

2. **Submit Credentials**
   - User enters email and password
   - System validates credentials with Supabase auth
   - If valid: System generates JWT token
   - If invalid: System displays error message

3. **Post-Login Navigation**
   - If user has a church: Redirect to dashboard
   - If user doesn't have a church: Redirect to church selection
   - System loads appropriate data based on user's church

### Password Reset Workflow

1. **Request Reset**
   - User clicks "Forgot Password" on login page
   - User enters email address
   - System sends password reset email

2. **Reset Password**
   - User clicks reset link in email
   - System displays password reset form
   - User enters new password
   - System updates password in Supabase auth
   - System redirects to login

## Church Management Workflows

### Church Creation Workflow

1. **Access Creation**
   - User navigates to "/churches/new"
   - System displays church creation form

2. **Submit Church Details**
   - User enters church name, location, description
   - User uploads optional church logo
   - System validates input
   - System creates church record in database
   - System associates current user as church admin
   - System updates user's profile with church_id

3. **Post-Creation**
   - System redirects to church dashboard
   - System displays success message
   - System enables admin features for user

### Church Member Management Workflow

1. **View Members**
   - Admin navigates to "/churches/{id}/members"
   - System displays list of church members with roles

2. **Manage Roles**
   - Admin selects member
   - Admin assigns/changes role (admin, worship_leader, member)
   - System updates role in user's profile
   - System displays confirmation message

3. **Remove Member**
   - Admin selects member
   - Admin clicks "Remove from Church"
   - System displays confirmation dialog
   - Admin confirms removal
   - System removes church_id from user's profile
   - System displays confirmation message

## Calendar Management Workflows

### Event Creation Workflow

1. **Access Event Creation**
   - User navigates to "/calendar/new" or clicks "New Event" on calendar
   - System displays event creation form

2. **Enter Event Details**
   - User enters title, description, date/time, location
   - User selects event type (service, practice, meeting, other)
   - User selects worship team (if applicable)
   - System validates input
   - System creates event record in database

3. **Add Event Content (for service events)**
   - User adds songs to event
   - User arranges song order
   - User adds notes for songs
   - System saves event-song associations

4. **Post-Creation**
   - System redirects to calendar view
   - System highlights newly created event
   - System displays success message

### Calendar Navigation Workflow

1. **Select View**
   - User chooses view type (month, quarter, year)
   - System updates calendar display

2. **Navigate Time Periods**
   - User clicks next/previous buttons
   - System updates calendar to show new time period

3. **Filter Events**
   - User selects event type filters
   - System updates displayed events based on filters

4. **View Event Details**
   - User clicks on an event
   - System displays event details modal/page
   - User can view all event information including attached content

### Event Modification Workflow

1. **Access Event Edit**
   - User clicks "Edit" on event details
   - System displays event edit form with current values

2. **Modify Event**
   - User updates event details
   - User submits changes
   - System validates input
   - System updates event record in database
   - System displays confirmation message

3. **Cancel Event**
   - User clicks "Cancel Event" on event details
   - System displays confirmation dialog
   - User confirms cancellation
   - System marks event as cancelled in database
   - System updates calendar display

## Worship Team Management Workflows

### Team Creation Workflow

1. **Access Team Creation**
   - Admin/worship leader navigates to "/teams/new"
   - System displays team creation form

2. **Submit Team Details**
   - User enters team name and description
   - System validates input
   - System creates team record in database

3. **Add Team Members**
   - User searches church members
   - User selects members to add to team
   - User assigns roles to team members
   - System creates team_members association records
   - System displays confirmation message

### Song Management Workflow

1. **Add New Song**
   - User navigates to "/songs/new"
   - System displays song creation form

2. **Enter Song Details**
   - User enters title, artist, key, tempo
   - User enters lyrics and chords (optional)
   - User adds notes (optional)
   - User uploads attachments (optional)
   - System validates input
   - System creates song record in database
   - System uploads attachments to storage

3. **Song Library Navigation**
   - User navigates to "/songs"
   - System displays song library
   - User can search, filter, and sort songs
   - User can view song details by clicking on a song

### Service Planning Workflow

1. **Select Service Event**
   - User navigates to calendar
   - User selects a service event
   - System displays service planning interface

2. **Add Songs to Service**
   - User searches song library
   - User selects songs to add to service
   - User arranges song order
   - User selects key for each song
   - User adds notes for each song
   - System saves service plan

3. **Assign Team Members**
   - User selects team members for the service
   - User assigns specific roles/instruments
   - System saves team assignments

## Prayer Request Workflows

### Submit Prayer Request Workflow

1. **Access Prayer Request Form**
   - User navigates to "/prayer-requests/new"
   - System displays prayer request form

2. **Submit Request**
   - User enters title and description
   - User selects privacy options:
     - Public (visible to all church members)
     - Private (visible only to admins)
     - Anonymous (name hidden but request visible)
   - System validates input
   - System creates prayer request record in database
   - System displays confirmation message

### Prayer Request Interaction Workflow

1. **View Prayer Requests**
   - User navigates to "/prayer-requests"
   - System displays list of prayer requests based on privacy settings

2. **Respond to Request**
   - User clicks on a prayer request
   - System displays request details
   - User clicks "I'm Praying"
   - System records prayer response
   - User can add an optional comment
   - System displays confirmation message

3. **Update Request Status**
   - Original requester views their request
   - User clicks "Mark as Answered"
   - System updates request status in database
   - System displays confirmation message
   - System shows "Answered" badge on the request

## Church Community Workflows

### Announcements Workflow

1. **Create Announcement**
   - Admin navigates to "/announcements/new"
   - System displays announcement creation form
   - Admin enters title, content, and optional image
   - System validates input
   - System creates announcement record in database
   - System displays confirmation message

2. **View Announcements**
   - User views dashboard
   - System displays recent announcements
   - User can click to view full announcement
   - User can acknowledge announcement

### Ministry Group Workflow

1. **Create Ministry Group**
   - Admin navigates to "/groups/new"
   - System displays group creation form
   - Admin enters group name, description, type
   - System validates input
   - System creates group record in database
   - System displays confirmation message

2. **Join Group**
   - User views available groups
   - User clicks "Join Group"
   - System creates group membership record
   - System displays confirmation message

3. **Group Interaction**
   - Group members can post updates
   - Group members can view group calendar
   - Group members can share resources
   - System tracks group activity

## Mobile Usage Workflows

### Mobile Navigation Workflow

1. **Primary Navigation**
   - User interacts with bottom navigation bar
   - Options include: Home, Calendar, Teams, Prayer, Profile
   - System navigates to selected section

2. **Secondary Navigation**
   - Within each section, swipe gestures navigate between related views
   - Pull-to-refresh updates content
   - System adapts UI based on screen size

### Offline Workflow

1. **Offline Detection**
   - System detects no internet connection
   - System displays offline indicator
   - System uses cached data for viewing

2. **Offline Actions**
   - User can view previously loaded content
   - User can create drafts of new content
   - System queues changes for sync

3. **Reconnection**
   - System detects internet connection restored
   - System syncs pending changes
   - System refreshes data
   - System notifies user of successful sync

## Data Security Workflows

### Permission Validation Workflow

1. **Action Attempt**
   - User attempts an action (create, read, update, delete)
   - System checks user permissions based on:
     - User role (admin, worship_leader, member)
     - User's church association
     - Record ownership

2. **Permission Result**
   - If allowed: System processes the action
   - If denied: System displays permission error
   - System logs permission attempt (for security)

### Content Privacy Workflow

1. **Content Creation**
   - User creates content with privacy settings
   - System saves privacy metadata with content

2. **Content Access**
   - User attempts to access content
   - System checks:
     - User's church association
     - Content privacy settings
     - User's relationship to content
   - System displays or hides content based on checks

These workflows represent the core user interactions within the Church Connect application. They serve as a guide for both development and testing to ensure a consistent, intuitive user experience throughout the application.
