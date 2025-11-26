# SmartSoil Version History

This document tracks changes between versions of the SmartSoil farm management application. When you duplicate the codebase to create a new version checkpoint, document the changes here.

---

## Version 1.0 - Initial Release

**Release Date:** Current State  
**Status:** Production Ready

### Application Overview

SmartSoil is a comprehensive farm management platform built with Next.js 15, React 19, TypeScript, and Supabase. The application provides farmers with tools to manage livestock, paddocks, tasks, infrastructure, and team collaboration.

### Core Features

#### 1. **Authentication & User Management**
- Email/password authentication via Supabase Auth
- User sign-up and login flows
- Protected routes with middleware
- Session management
- Profile creation and management

#### 2. **Farm Profile Management**
- Farm name and location setup
- GPS coordinate tracking
- Farm location confirmation workflow
- Enterprise type selection (Livestock, Cropping, Mixed)
- Animal and crop type tracking
- Bio/description fields

#### 3. **Paddock Management**
- Interactive map-based paddock creation using Mapbox GL
- Draw paddocks directly on map with polygon tools
- Paddock types: Pasture, Cropping, Mixed, Native Bush, Wetland, Agroforestry, Other
- Custom color preferences per paddock type
- Area calculation (hectares)
- Paddock details view with grazing status
- Stocking rate calculations (DSE - Dry Sheep Equivalent)
- Paddock editing and deletion

#### 4. **Livestock Management (Mobs)**
- Mob creation and management
- Mob size tracking
- Mob status tracking (active, sold, archived)
- Grazing event tracking
- Livestock events:
  - Add lambs (birth events)
  - Add sheep (purchase events)
  - Mark sold
  - Register losses
  - Lambing worksheet
- Animal records with age calculations
- Mob analytics and statistics
- Days in paddock tracking
- Move mobs between paddocks

#### 5. **Task Management**
- Create, edit, and delete tasks
- Task assignment to paddocks
- Task assignment to team members
- Task priority levels
- Task status (pending, in progress, completed)
- Task due dates
- Task filtering by paddock
- Task completion tracking

#### 6. **Infrastructure Management**
- Pin infrastructure on map (points)
- Infrastructure types (fences, gates, water points, etc.)
- Capacity tracking
- Condition status
- Notes and details
- Infrastructure details view

#### 7. **Team Collaboration**
- Team member invitations via email
- Role-based access control:
  - Owner (full access)
  - Admin (manage data and members)
  - Member (view and edit data)
  - Viewer (read-only)
- Invitation management (send, resend, cancel)
- Team member management page
- Shared access to farm data

#### 8. **Map Integration**
- Mapbox GL integration for interactive maps
- Satellite and terrain map styles
- Paddock visualization with custom colors
- Mob location display
- Infrastructure markers
- Map filters:
  - Filter by paddock type
  - Show only paddocks with tasks
- Map view modes:
  - Default (55% content, 45% map)
  - Fullscreen map
  - Collapsed map
- Paddock name labels (toggleable)
- Drawing tools for paddock creation
- Pin drop for farm location confirmation

#### 9. **Weather Integration**
- Weather data fetching based on farm location
- Rainfall data visualization
- Weather condition display
- Historical rainfall tracking

#### 10. **Dashboard**
- Multi-tab interface:
  - Overview tab (farm summary, recent tasks, weather)
  - Livestock tab (mob management)
  - Tasks tab (task management)
  - Infrastructure tab
  - Edit Map tab (paddock drawing tools)
- Sidebar navigation
- Responsive design
- Dark theme support

#### 11. **Settings**
- Map settings (paddock color preferences)
- Account settings
- Farm profile editing
- Location management

### Technical Stack

#### Frontend
- **Framework:** Next.js 15.5.4 (App Router)
- **React:** 19.1.0
- **TypeScript:** 5.x
- **Styling:** Tailwind CSS 4.1.9
- **UI Components:** Radix UI primitives
- **Forms:** React Hook Form + Zod validation
- **Maps:** Mapbox GL 3.15.0, react-map-gl 8.1.0
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** Sonner (toast notifications)
- **Date Handling:** date-fns 4.1.0

#### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime (via Supabase client)

#### Database Schema
- `profiles` - User/farm profiles
- `paddocks` - Paddock definitions with GeoJSON geometry
- `mobs` - Livestock mobs
- `grazing_events` - Grazing history
- `animals` - Individual animal records
- `tasks` - Task management
- `task_paddocks` - Task-paddock relationships
- `infrastructure` - Infrastructure items with GeoJSON points
- `farm_members` - Team member relationships
- `farm_invitations` - Invitation system

#### Row Level Security (RLS)
- Comprehensive RLS policies for data access
- Team member access to farm owner's data
- Owner-only operations (delete, invite)
- Role-based permissions

### Project Structure

```
next-auth-setup/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── admin/            # Team management
│   ├── invite/           # Invitation acceptance
│   └── protected/        # Protected route handler
├── components/            # React components
│   ├── dashboard/        # Dashboard-specific components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
│   ├── supabase/        # Supabase client setup
│   ├── constants/       # Application constants
│   └── utils/           # Utility functions
├── types/               # TypeScript type definitions
├── scripts/             # Database migration scripts (28 SQL files)
└── public/              # Static assets
```

### Key Hooks

- `use-profile.ts` - Profile management
- `use-weather.ts` - Weather data fetching
- `use-paddocks.ts` - Paddock CRUD operations
- `use-mobs.ts` - Mob management
- `use-tasks.ts` - Task management
- `use-infrastructure.ts` - Infrastructure management
- `use-team-members.ts` - Team member data
- `use-grazing.ts` - Grazing calculations
- `use-mob-events.ts` - Livestock event tracking
- `use-mapbox.ts` - Map initialization and management
- `use-farm-owner.ts` - Farm owner ID resolution

### Database Migrations

28 SQL migration scripts covering:
- Table creation
- RLS policy setup
- Function creation
- Schema updates
- Index creation

### Notable Features

1. **Onboarding Flow:** Guided setup for new users (location confirmation, farm name)
2. **Tutorial System:** Welcome tutorial and paddock drawing tutorial
3. **Analytics:** Mob analytics, stocking rates, DSE calculations
4. **Responsive Design:** Mobile-friendly interface
5. **Error Handling:** Comprehensive error handling with user-friendly messages
6. **Loading States:** Loading indicators throughout the app
7. **Toast Notifications:** User feedback via toast notifications

### Known Limitations / Future Enhancements

- Payment/billing system for team members beyond 3 free members (placeholder exists)
- Advanced reporting and analytics
- Mobile app version
- Offline support
- Export functionality (CSV, PDF)
- Advanced grazing management (rotational grazing planning)
- Integration with external farm management systems

---

## Version History Template

When creating a new version, use this template:

```markdown
## Version X.X - [Version Name]

**Release Date:** [Date]  
**Status:** [Draft/In Progress/Released]

### Summary
[Brief summary of what changed in this version]

### Added
- [New features]
- [New components]
- [New functionality]

### Changed
- [Modified features]
- [Refactored code]
- [Updated dependencies]

### Fixed
- [Bug fixes]
- [Issues resolved]

### Removed
- [Deprecated features]
- [Removed code]

### Breaking Changes
- [Any breaking changes that require migration]

### Migration Notes
- [Steps needed to upgrade from previous version]
```

---

*Last Updated: [Current Date]*

