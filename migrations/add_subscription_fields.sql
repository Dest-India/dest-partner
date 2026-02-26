-- Add plan_id column
ALTER TABLE public.partner_payments
ADD COLUMN IF NOT EXISTS plan_id TEXT NULL;

-- Add plan_name column
ALTER TABLE public.partner_payments
ADD COLUMN IF NOT EXISTS plan_name TEXT NULL;

-- Add duration_months column
ALTER TABLE public.partner_payments
ADD COLUMN IF NOT EXISTS duration_months INTEGER NULL;

-- Add expires_at column
ALTER TABLE public.partner_payments
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Add index for expires_at for efficient expiry checks
CREATE INDEX IF NOT EXISTS partner_payments_expires_at_idx 
ON public.partner_payments USING btree (expires_at) 
TABLESPACE pg_default;

-- Add constraint for valid plan_id
ALTER TABLE public.partner_payments
ADD CONSTRAINT partner_payments_plan_id_check 
CHECK (plan_id IN ('monthly', 'halfyearly', 'yearly') OR plan_id IS NULL);

-- Comment on new columns
COMMENT ON COLUMN public.partner_payments.plan_id IS 'Plan type: monthly, halfyearly, or yearly';
COMMENT ON COLUMN public.partner_payments.plan_name IS 'Human-readable plan name';
COMMENT ON COLUMN public.partner_payments.duration_months IS 'Total subscription duration in months including bonus';
COMMENT ON COLUMN public.partner_payments.expires_at IS 'Subscription expiry timestamp';
