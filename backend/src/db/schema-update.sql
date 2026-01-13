-- Add monthly expenses table for rolling 3-month average calculation

CREATE TABLE IF NOT EXISTS monthly_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expense_month DATE NOT NULL, -- First day of the month (YYYY-MM-01)
  total_amount DECIMAL(12,2) NOT NULL,

  -- Expense breakdown (optional)
  housing DECIMAL(12,2) DEFAULT 0,
  food DECIMAL(12,2) DEFAULT 0,
  transportation DECIMAL(12,2) DEFAULT 0,
  utilities DECIMAL(12,2) DEFAULT 0,
  insurance DECIMAL(12,2) DEFAULT 0,
  healthcare DECIMAL(12,2) DEFAULT 0,
  entertainment DECIMAL(12,2) DEFAULT 0,
  other DECIMAL(12,2) DEFAULT 0,

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, expense_month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_expenses_user_month ON monthly_expenses(user_id, expense_month DESC);

-- Update assets table to include is_liquid flag
ALTER TABLE assets ADD COLUMN IF NOT EXISTS is_liquid BOOLEAN DEFAULT true;

-- Update assets to mark which are liquid
-- Liquid assets: savings, stocks, bonds, crypto
-- Illiquid assets: real_estate, business
UPDATE assets SET is_liquid = true WHERE category IN ('savings', 'stocks', 'bonds', 'crypto');
UPDATE assets SET is_liquid = false WHERE category IN ('real_estate', 'business');

COMMENT ON TABLE monthly_expenses IS 'Tracks actual monthly expenses for calculating rolling 3-month average';
COMMENT ON COLUMN monthly_expenses.expense_month IS 'First day of the month (e.g., 2026-01-01 for January 2026)';
COMMENT ON COLUMN assets.is_liquid IS 'True if asset can be converted to cash within 30 days';
