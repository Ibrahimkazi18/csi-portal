# Database Schema for CSI Portal

This document outlines the database schema for the CSI Portal, including the comprehensive manual events and workshops functionality with drag-and-drop progression and winners management.

## Migration Files

### 001_add_event_features.sql
Comprehensive manual events and workshops support including:
- Manual events (backdoor entry system)
- Tournament rounds and progression tracking
- Drag-and-drop round management
- Winners and results management
- Workshops and seminars
- Event participants tracking
- Workshop hosts
- Comprehensive audit logging

## Core Tables

### events
Main events table with support for both portal-created and manually-entered events.

**Key Columns:**
- `source`: 'portal' | 'manual' - Indicates how the event was created
- `mode`: 'event' | 'workshop' - Event type (competitive vs learning)
- `manual_status`: 'draft' | 'finalized' - Status for manual events
- `is_tournament`: boolean - Whether event has competitive rounds
- `team_size`: integer - Required team size for team events
- `created_by`, `updated_by`: User tracking for manual entries

### event_rounds
Tournament structure for competitive events.

**Key Columns:**
- `event_id`: Foreign key to events table
- `round_number`: Sequential round numbering
- `title`: Round name (e.g., "Quarterfinals", "Final")
- `description`: Optional round details

### event_progress
Tracks participant movement through tournament rounds via drag-and-drop interface.

**Key Columns:**
- `event_id`: Foreign key to events table
- `round_id`: Foreign key to event_rounds table
- `team_id` | `user_id`: Participant identifier (mutually exclusive)
- `eliminated`: boolean - Whether participant was eliminated
- `position`: Optional ranking within round
- `moved_at`: Timestamp of round progression

### event_winners
Final results and winners for events with podium-style selection.

**Key Columns:**
- `event_id`: Foreign key to events table
- `position`: 1, 2, or 3 (podium positions)
- `team_id` | `user_id`: Winner identifier (mutually exclusive)
- `points_awarded`: Points given to winner
- `prize`: Optional prize description

### event_participants
Individual participant registrations (alternative to event_registrations for manual events).

**Key Columns:**
- `event_id`: Foreign key to events table
- `user_id`: Foreign key to profiles table (nullable for external participants)
- `email`: Participant email (required)
- `name`: Participant name (for external participants)
- `attendance_status`: 'registered' | 'present' | 'absent'

### workshop_hosts
Speakers and hosts for workshop-type events.

**Key Columns:**
- `event_id`: Foreign key to events table
- `name`: Host name (required)
- `designation`: Optional title/role
- `organization`: Optional organization
- `profile_id`: Optional link to existing user profile

### event_audit_logs
Comprehensive audit trail for all manual event operations.

**Key Columns:**
- `event_id`: Foreign key to events table
- `action`: Action type (e.g., 'manual_event_created', 'participant_moved', 'winners_declared')
- `performed_by`: User who performed the action
- `metadata`: JSON data with action details
- `created_at`: Timestamp

## Manual Event Workflow

### 1. Event Details
- Core team creates event with comprehensive form
- Support for both individual and team events
- Workshop vs tournament mode selection
- All dates must be in the past (historical events)

### 2. Round Configuration (for tournaments)
- Dynamic round creation with drag-and-drop reordering
- Each round has sequential numbering and descriptive titles
- Workshop events skip this step entirely

### 3. Participant Management
- **Individual Events**: Search existing members or manual entry
- **Team Events**: Team builder with exact member validation
- Real-time member availability checking
- Support for external participants not in the system

### 4. Round Progression (for tournaments)
- **Kanban-style board** with columns for each round + eliminated
- **Drag-and-drop interface** for moving participants between rounds
- **Real-time validation** and visual feedback
- **Bulk actions** for moving multiple participants
- **Progress tracking** showing completion status

### 5. Results & Winners
- **Podium-style interface** for selecting top 3 winners
- **Drag-and-drop from finalists** to podium positions
- **Manual selection via dropdowns** as fallback
- **Points allocation** and prize assignment
- **Winner validation** ensures participants are eligible

### 6. Finalization
- **Comprehensive review** of all entered data
- **Event status** changed to 'finalized'
- **Integration** with existing event system
- **Audit trail** completion

## Key Features

### Drag-and-Drop Progression
- **Kanban board** with round columns
- **Visual feedback** during drag operations
- **Real-time updates** to database
- **Undo/redo** capability
- **Bulk operations** for efficiency

### Podium-Style Winners Selection
- **Visual podium** with 1st, 2nd, 3rd place positions
- **Drag-and-drop** from finalists pool
- **Dropdown fallback** for manual selection
- **Points and prizes** configuration
- **Team vs individual** support

### Member Integration
- **Search existing members** from portal database
- **Real-time filtering** and selection
- **Duplicate prevention** across teams
- **External participant** support
- **Email validation** and member linking

### Comprehensive Audit Trail
- **All operations logged** with full metadata
- **User tracking** for accountability
- **Action history** with timestamps
- **Rollback capability** for corrections
- **Compliance reporting**

## Security & Permissions

### Row Level Security (RLS)
- **Core team only**: Create, edit, delete manual events
- **President only**: Delete finalized events
- **Member access**: View finalized events and workshops
- **Audit logs**: Core team read access only

### Data Validation
- **Date validation**: All dates must be in past
- **Team size validation**: Exact member count required
- **Duplicate prevention**: No double-booking of participants
- **Email validation**: Proper email format enforcement
- **Business rules**: Tournament vs workshop constraints

## Integration Points

### Existing Event System
- **Seamless integration** with portal-created events
- **Unified event listings** once finalized
- **Compatible results viewing** and registration display
- **Consistent data models** and relationships

### Live Event Management
- **Drag-and-drop patterns** can be applied to live events
- **Round progression UI** reusable for real-time tournaments
- **Winner selection** interface for live results
- **Audit logging** for live event changes

## Running Migrations

Execute the migration files in your Supabase SQL editor:

```sql
-- Run in Supabase SQL Editor
-- File: database/migrations/001_add_event_features.sql
```

Or using Supabase CLI:

```bash
supabase db reset
```

## Usage

After running the migrations:

1. **Core Team**: Access comprehensive manual event creation at `/core/events/manual`
2. **Event Creation**: 5-step wizard with drag-and-drop interfaces
3. **Round Management**: Kanban board for tournament progression
4. **Winner Selection**: Podium interface for results
5. **Members**: Browse all events including manual entries at `/member/events`
6. **Workshops**: Dedicated workshop section at `/member/workshops`

## Dependencies

- **@dnd-kit/core**: Drag-and-drop functionality
- **@dnd-kit/sortable**: Sortable lists and kanban boards
- **@dnd-kit/utilities**: Utility functions for drag operations

## Future Enhancements

- **Live event integration**: Apply drag-and-drop to real-time events
- **Advanced reporting**: Analytics and insights from manual events
- **Bulk import**: CSV/Excel import for large historical datasets
- **Mobile optimization**: Touch-friendly drag-and-drop interfaces