import pool from './connection';

const migrations = `
-- Drop existing types if they exist
DROP TYPE IF EXISTS income_type CASCADE;
DROP TYPE IF EXISTS asset_category CASCADE;
DROP TYPE IF EXISTS liability_type CASCADE;

-- Create custom types
CREATE TYPE income_type AS ENUM ('active', 'semi_passive', 'passive');
CREATE TYPE asset_category AS ENUM ('real_estate', 'stocks', 'bonds', 'crypto', 'business', 'savings', 'other');
CREATE TYPE liability_type AS ENUM ('mortgage', 'car_loan', 'student_loan', 'credit_card', 'personal_loan', 'business_loan', 'other');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Financial profiles table
CREATE TABLE IF NOT EXISTS financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  monthly_living_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  target_emergency_months INTEGER DEFAULT 12,
  target_debt_ratio DECIMAL(5,2) DEFAULT 20.00,
  target_income_engines INTEGER DEFAULT 2,
  currency VARCHAR(3) DEFAULT 'IDR',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Income engines table
CREATE TABLE IF NOT EXISTS income_engines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type income_type NOT NULL,
  monthly_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  growth_rate DECIMAL(5,2) DEFAULT 0,
  stability_score INTEGER CHECK (stability_score BETWEEN 1 AND 10),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_engines_user ON income_engines(user_id);
CREATE INDEX IF NOT EXISTS idx_income_engines_type ON income_engines(type);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category asset_category NOT NULL,
  current_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  monthly_yield DECIMAL(12,2) DEFAULT 0,
  annual_roi DECIMAL(5,2) DEFAULT 0,
  automation_level INTEGER CHECK (automation_level BETWEEN 1 AND 10),
  is_liquid BOOLEAN DEFAULT true,
  description TEXT,
  purchase_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);

-- Liabilities table
CREATE TABLE IF NOT EXISTS liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type liability_type NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  remaining_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  monthly_payment DECIMAL(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_liabilities_user ON liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_type ON liabilities(type);

-- Freedom snapshots table
CREATE TABLE IF NOT EXISTS freedom_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_active_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_passive_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_semi_passive_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_asset_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_asset_yield DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_liability_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  monthly_debt_payment DECIMAL(12,2) NOT NULL DEFAULT 0,
  monthly_living_cost DECIMAL(12,2) NOT NULL,
  coverage_ratio DECIMAL(8,4) NOT NULL,
  net_worth DECIMAL(12,2) NOT NULL,
  emergency_fund_months DECIMAL(8,2) NOT NULL,
  debt_ratio DECIMAL(5,2) NOT NULL,
  active_income_engines INTEGER NOT NULL,
  freedom_score DECIMAL(5,2) NOT NULL,
  runway_months DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON freedom_snapshots(user_id, snapshot_date DESC);

-- Monthly expenses table for rolling 3-month average calculation
CREATE TABLE IF NOT EXISTS monthly_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expense_month DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
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

-- Simulation scenarios table
CREATE TABLE IF NOT EXISTS simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  additional_income DECIMAL(12,2) DEFAULT 0,
  additional_investment DECIMAL(12,2) DEFAULT 0,
  investment_roi DECIMAL(5,2) DEFAULT 0,
  debt_payoff_amount DECIMAL(12,2) DEFAULT 0,
  living_cost_change DECIMAL(12,2) DEFAULT 0,
  current_freedom_date DATE,
  projected_freedom_date DATE,
  months_accelerated INTEGER,
  projected_freedom_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenarios_user ON simulation_scenarios(user_id);

-- Insert demo user for development
INSERT INTO users (id, email, password_hash, name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@freedom.cash',
  '$2b$10$placeholder',
  'Demo User'
) ON CONFLICT (id) DO NOTHING;

-- Insert default financial profile for demo user
INSERT INTO financial_profiles (user_id, monthly_living_cost, currency)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  5000000,
  'IDR'
) ON CONFLICT (user_id) DO NOTHING;
`;

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('Starting database migrations...');
    await client.query(migrations);
    console.log('✓ Database migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default runMigrations;
