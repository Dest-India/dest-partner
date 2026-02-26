-- Add rate_per_hour column back to turf_courts table
ALTER TABLE public.turf_courts
ADD COLUMN IF NOT EXISTS rate_per_hour numeric NOT NULL DEFAULT 0;

-- Remove default after adding the column (so future inserts must provide a value)
ALTER TABLE public.turf_courts
ALTER COLUMN rate_per_hour DROP DEFAULT;
