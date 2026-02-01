-- Migration: Add Manual Events and Workshops Support
-- Date: 2025-01-31

-- 1. Modify events table to support manual events and workshops
-- Note: Using existing start_date and end_date columns instead of event_date
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('portal', 'manual')) DEFAULT 'portal',
ADD COLUMN IF NOT EXISTS mode TEXT CHECK (mode IN ('event', 'workshop')) NOT NULL DEFAULT 'event',
ADD COLUMN IF NOT EXISTS manual_status TEXT CHECK (manual_status IN ('draft', 'finalized')) NULL,
ADD COLUMN IF NOT EXISTS duration INTEGER NULL, -- Duration in minutes for workshops
ADD COLUMN IF NOT EXISTS venue TEXT NULL,
ADD COLUMN IF NOT EXISTS meeting_link TEXT NULL,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES profiles(id) NULL,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Create event_participants table for individual registrations
CREATE TABLE IF NOT EXISTS public.event_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    email text NOT NULL,
    name text NULL,
    role text NULL,
    attendance_status text DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'present', 'absent')),
    created_at timestamptz DEFAULT now(),
    UNIQUE (event_id, email)
);

-- 3. Create workshop_hosts table for workshop speakers/hosts
CREATE TABLE IF NOT EXISTS public.workshop_hosts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    name text NOT NULL,
    designation text NULL,
    organization text NULL,
    profile_id uuid REFERENCES profiles(id) NULL, -- Link to existing profile if available
    created_at timestamptz DEFAULT now()
);

-- 4. Create event_audit_logs table for tracking manual changes
CREATE TABLE IF NOT EXISTS public.event_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    action text NOT NULL,
    performed_by uuid REFERENCES profiles(id),
    metadata jsonb NULL,
    created_at timestamptz DEFAULT now()
);

-- 5. Create event_rounds table if it doesn't exist (for tournament structure)
CREATE TABLE IF NOT EXISTS public.event_rounds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NULL,
    round_number integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (event_id, round_number)
);

-- 6. Create event_progress table for tracking participant movement through rounds
CREATE TABLE IF NOT EXISTS public.event_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    round_id uuid REFERENCES event_rounds(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NULL,
    position integer NULL,
    eliminated boolean DEFAULT false,
    moved_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    CONSTRAINT event_progress_participant_check CHECK (
        (team_id IS NOT NULL AND user_id IS NULL) OR 
        (team_id IS NULL AND user_id IS NOT NULL)
    )
);

-- 7. Create event_winners table for storing final results
CREATE TABLE IF NOT EXISTS public.event_winners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    position integer NOT NULL CHECK (position >= 1 AND position <= 3),
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NULL,
    points_awarded integer NULL,
    prize text NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (event_id, position),
    CONSTRAINT event_winners_participant_check CHECK (
        (team_id IS NOT NULL AND user_id IS NULL) OR 
        (team_id IS NULL AND user_id IS NOT NULL)
    )
);

-- 8. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_email ON public.event_participants(email);
CREATE INDEX IF NOT EXISTS idx_workshop_hosts_event_id ON public.workshop_hosts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_audit_logs_event_id ON public.event_audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rounds_event_id ON public.event_rounds(event_id);
CREATE INDEX IF NOT EXISTS idx_event_progress_event_id ON public.event_progress(event_id);
CREATE INDEX IF NOT EXISTS idx_event_progress_round_id ON public.event_progress(round_id);
CREATE INDEX IF NOT EXISTS idx_event_winners_event_id ON public.event_winners(event_id);
CREATE INDEX IF NOT EXISTS idx_events_source ON public.events(source);
CREATE INDEX IF NOT EXISTS idx_events_mode ON public.events(mode);
CREATE INDEX IF NOT EXISTS idx_events_manual_status ON public.events(manual_status);

-- 9. Enable RLS (Row Level Security) for new tables
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_winners ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies
-- Event participants: readable by all authenticated users, writable by core team
CREATE POLICY "event_participants_read" ON public.event_participants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "event_participants_write" ON public.event_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'core'
        )
    );

-- Workshop hosts: readable by all authenticated users, writable by core team
CREATE POLICY "workshop_hosts_read" ON public.workshop_hosts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "workshop_hosts_write" ON public.workshop_hosts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'core'
        )
    );

-- Event audit logs: readable and writable only by core team
CREATE POLICY "event_audit_logs_core_only" ON public.event_audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'core'
        )
    );

-- Event rounds: readable by all authenticated users, writable by core team
CREATE POLICY "event_rounds_read" ON public.event_rounds
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "event_rounds_write" ON public.event_rounds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'core'
        )
    );

-- Event progress: readable by all authenticated users, writable by core team
CREATE POLICY "event_progress_read" ON public.event_progress
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "event_progress_write" ON public.event_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'core'
        )
    );

-- Event winners: readable by all authenticated users, writable by core team
CREATE POLICY "event_winners_read" ON public.event_winners
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "event_winners_write" ON public.event_winners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'core'
        )
    );

-- 11. Grant necessary permissions
GRANT ALL ON public.event_participants TO authenticated;
GRANT ALL ON public.workshop_hosts TO authenticated;
GRANT ALL ON public.event_audit_logs TO authenticated;
GRANT ALL ON public.event_rounds TO authenticated;
GRANT ALL ON public.event_progress TO authenticated;
GRANT ALL ON public.event_winners TO authenticated;