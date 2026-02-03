-- Fix workshop_hosts table to add missing columns
-- Run this in your Supabase SQL editor

-- Add missing columns if they don't exist
ALTER TABLE public.workshop_hosts 
ADD COLUMN IF NOT EXISTS bio text NULL,
ADD COLUMN IF NOT EXISTS photo_url text NULL,
ADD COLUMN IF NOT EXISTS organization text NULL,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update the table comment
COMMENT ON TABLE public.workshop_hosts IS 'Stores workshop hosts/speakers information';

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'workshop_hosts' 
AND table_schema = 'public'
ORDER BY ordinal_position;