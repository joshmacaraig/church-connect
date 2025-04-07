# Church Connect - Feature Documentation

## Overview

Church Connect is a mobile-first social media application designed specifically for Christian communities. This document provides comprehensive details about the application's core features, how they work, and how they integrate with each other.

## Core Features

### Social Feed

The central feature of Church Connect is the social feed, which provides a unified stream of community activity.

#### Feed Components
- **Timeline:** Chronological display of posts, events, prayer requests, and announcements
- **Post Types:** 
  - Regular posts (text, images, videos)
  - Prayer requests
  - Event posts
  - Announcements (admin/worship leader only)
- **Interactions:** Like, comment, pray, and share functionality
- **Filtering:** Filter feed by content type, followed users, or church
- **PostComposer:** Create posts with rich media and specify post type
  
#### Backend Implementation
The feed is powered by several database tables:
- `posts`: Stores all post content with a `post_type` field
- `reactions`: Stores user reactions (likes, prayers)
- `comments`: Stores comments on posts
- Related tables: `prayer_requests`, `events` linked via `related_id`

### Profile System

Enhanced social profiles that showcase members' spiritual gifts, ministry interests, and community activity.

#### Profile Components
- **ProfileHeader:** Cover photo, avatar, basic info, and stats
- **ProfileInfo:** Spiritual gifts, ministry interests, bio, and contact info
- **PostsList:** Tabbed display of user's posts
- **ConnectionsList:** Followers and following lists

#### Features
- Customizable profiles with cover photos and avatars
- Spiritual gifts and ministry interests
- Activity stats (posts, followers, following)
- Follow/unfollow system
- Media uploads for profile pictures and cover photos

### Authentication System

A comprehensive user authentication system powered by Supabase Auth.

#### Features
- Email/password registration and login
- Email verification
- Password reset
- Protected routes for authenticated content
- Role-based permissions (admin, worship leader, member)

### Church Management

Allows users to create, join, and manage churches.

#### Features
- Church creation with name, location, description, and logo
- Church joining via invites or codes
- Member management and role assignment
- Church profile pages

### Calendar System

An event management system for church activities.

#### Features
- Multiple calendar views (monthly, quarterly, yearly)
- Event creation and editing
- Event details and attendee management
- Recurring events
- Calendar sharing

### Worship Team Management

Tools for organizing and coordinating worship teams.

#### Features
- Team creation and member assignment
- Scheduling for services and practices
- Song library with chord charts and lyrics
- Service planning tools

### Prayer Request System

A system for submitting and responding to prayer requests.

#### Features
- Prayer request submission with privacy controls
- Integration with the social feed
- "Pray" reaction functionality
- Response and follow-up tracking
- Anonymous request option

### Notifications

A real-time notification system for social interactions and important events.

#### Features
- Interaction notifications (likes, comments, follows)
- Event reminders
- Prayer request updates
- Mention notifications
- Read/unread status tracking

## Technical Implementation

### Database Schema
The application uses a PostgreSQL database through Supabase with tables for:
- User profiles and authentication
- Churches and church membership
- Social content (posts, comments, reactions)
- Worship teams and members
- Events and calendar data
- Prayer requests
- Notifications
- Social connections (follows)

### Security

#### Row-Level Security (RLS)
All database tables implement Row-Level Security to ensure users can only access data they're authorized to see:
- Church-specific content is only visible to church members
- Private content is visible only to appropriate users
- Users can only modify their own content (with exceptions for admins)

#### Authentication
- JWT-based authentication through Supabase Auth
- Secure password hashing
- Email verification
- Role-based authorization

### Frontend Components

#### Layout Components
- Responsive layout with mobile-first design
- Bottom navigation for mobile
- Sidebar for desktop
- Header with notifications and user menu

#### Feed Components
- Feed container with infinite scrolling
- Post component with interactions
- PostComposer for creating new content
- Filter controls for content types

#### Profile Components
- ProfileHeader with avatar and cover photo
- ProfileInfo with spiritual gifts and interests
- PostsList for user content
- ConnectionsList for social network

#### Church Components
- Church profile with description and member list
- Church joining interface
- Member management tools

#### Calendar Components
- Calendar views (month, week, day)
- Event creation and editing forms
- Event details view

#### Prayer Components
- Prayer request form
- Prayer feed with privacy controls
- Prayer response interface

## Integration Points

### Social Feed and Other Features
The social feed integrates with other features:
- Events appear in the feed when created or updated
- Prayer requests can be posted to the feed
- Song additions can be shared to the feed
- Church announcements appear in members' feeds

### Notifications and Activities
- Social interactions trigger notifications
- Calendar events generate reminders
- Prayer requests notify appropriate users
- Team assignments create notifications

### User Profiles and Church Membership
- Profiles display church affiliation
- Church pages show member profiles
- Team membership appears on profiles

## Mobile Responsiveness

Church Connect is designed with a mobile-first approach:
- Responsive layouts that adapt to screen sizes
- Touch-friendly interface elements
- Bottom navigation for mobile devices
- Optimized media loading for mobile data
- Progressive web app capabilities

## Future Features

Planned features for future development:
- Direct messaging between members
- Group chat for teams and ministries
- Advanced media features (audio, livestreaming)
- Bible study tools integration
- Giving and donation management
- Sermon archives and notes
- Check-in system for events
- Ministry volunteer coordination
