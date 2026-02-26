-- Add payment_status column to partners table
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS payment_status JSONB DEFAULT '{"status": "pending"}'::jsonb;

-- Create index for efficient querying by payment status
CREATE INDEX IF NOT EXISTS idx_partners_payment_status 
ON partners ((payment_status->>'status'));

-- Create index for efficient querying by expiry date
CREATE INDEX IF NOT EXISTS idx_partners_payment_expires 
ON partners ((payment_status->>'expires_at'));

-- Function to automatically update expired subscriptions
CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE partners
  SET payment_status = jsonb_set(
    payment_status,
    '{status}',
    '"expired"'
  )
  WHERE 
    payment_status->>'status' = 'paid'
    AND (payment_status->>'expires_at')::timestamp < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a trigger to check expiry on SELECT (not recommended for performance)
-- Better to use cron/edge function

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_expired_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION update_expired_subscriptions() TO service_role;
