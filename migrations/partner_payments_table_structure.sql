-- Partner Payments Table Structure
-- This table stores the complete history of all payments made by partners

-- Expected structure (if not already created):
CREATE TABLE IF NOT EXISTS partner_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('yearly', 'halfyearly')),
  amount DECIMAL(10, 2) NOT NULL,
  payment_made_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  payment_gateway TEXT, -- 'razorpay', 'stripe', etc.
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_partner_payments_partner_id ON partner_payments(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_payments_transaction_id ON partner_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_partner_payments_status ON partner_payments(status);
CREATE INDEX IF NOT EXISTS idx_partner_payments_expires_at ON partner_payments(expires_at);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_partner_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partner_payments_updated_at
BEFORE UPDATE ON partner_payments
FOR EACH ROW
EXECUTE FUNCTION update_partner_payments_updated_at();

-- Sample data structure
-- {
--   "id": "uuid",
--   "partner_id": "uuid",
--   "plan": "yearly",
--   "amount": 5666.00,
--   "payment_made_at": "2026-01-31T10:00:00Z",
--   "expires_at": "2027-01-31T10:00:00Z",
--   "transaction_id": "pay_razorpay_xyz123",
--   "payment_gateway": "razorpay",
--   "status": "success"
-- }
