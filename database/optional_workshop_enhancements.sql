-- Optional enhancements for workshop_hosts table
-- Run this in your Supabase SQL editor if you want to add bio and photo_url support

-- Add optional columns for enhanced workshop host information
ALTER TABLE public.workshop_hosts 
ADD COLUMN IF NOT EXISTS bio text NULL,
ADD COLUMN IF NOT EXISTS photo_url text NULL,
ADD COLUMN IF NOT EXISTS organization text NULL,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Add missing created_at column to event_participants if needed
ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update table comments
COMMENT ON TABLE public.workshop_hosts IS 'Stores workshop hosts/speakers information';
COMMENT ON COLUMN public.workshop_hosts.bio IS 'Brief biography of the host/speaker';
COMMENT ON COLUMN public.workshop_hosts.photo_url IS 'Profile photo URL of the host/speaker';
COMMENT ON COLUMN public.workshop_hosts.organization IS 'Organization/company of the host/speaker';

-- Verify the table structures
SELECT 'workshop_hosts columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'workshop_hosts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'event_participants columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'event_participants' 
AND table_schema = 'public'
ORDER BY ordinal_position;