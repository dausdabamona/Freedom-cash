# Financial Freedom Navigator - Database Schema

## Core Entities

### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. financial_profiles
```sql
CREATE TABLE financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  monthly_living_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  target_emergency_months INTEGER DEFAULT 12,
  target_debt_ratio DECIMAL(5,2) DEFAULT 20.00,
  target_income_engines INTEGER DEFAULT 2,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### 3. income_engines
```sql
CREATE TYPE income_type AS ENUM ('active', 'semi_passive', 'passive');

CREATE TABLE income_engines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type income_type NOT NULL,
  monthly_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  growth_rate DECIMAL(5,2) DEFAULT 0, -- percentage per year
  stability_score INTEGER CHECK (stability_score BETWEEN 1 AND 10),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_income_engines_user ON income_engines(user_id);
CREATE INDEX idx_income_engines_type ON income_engines(type);
```

### 4. assets
```sql
CREATE TYPE asset_category AS ENUM (
  'real_estate', 'stocks', 'bonds', 'crypto',
  'business', 'savings', 'other'
);

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category asset_category NOT NULL,
  current_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  monthly_yield DECIMAL(12,2) DEFAULT 0, -- actual monthly income from asset
  annual_roi DECIMAL(5,2) DEFAULT 0, -- percentage
  automation_level INTEGER CHECK (automation_level BETWEEN 1 AND 10),
  is_liquid BOOLEAN DEFAULT true, -- can be converted to cash within 30 days
  description TEXT,
  purchase_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_assets_category ON assets(category);
```

### 5. liabilities
```sql
CREATE TYPE liability_type AS ENUM (
  'mortgage', 'car_loan', 'student_loan',
  'credit_card', 'personal_loan', 'business_loan', 'other'
);

CREATE TABLE liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type liability_type NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  remaining_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0, -- percentage per year
  monthly_payment DECIMAL(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_liabilities_user ON liabilities(user_id);
CREATE INDEX idx_liabilities_type ON liabilities(type);
```

### 6. freedom_snapshots
Monthly snapshots to track progress over time
```sql
CREATE TABLE freedom_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,

  -- Income metrics
  total_active_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_passive_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_semi_passive_income DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Asset metrics
  total_asset_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_asset_yield DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Liability metrics
  total_liability_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  monthly_debt_payment DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Freedom metrics
  monthly_living_cost DECIMAL(12,2) NOT NULL,
  coverage_ratio DECIMAL(8,4) NOT NULL, -- passive_income / living_cost
  net_worth DECIMAL(12,2) NOT NULL, -- assets - liabilities
  emergency_fund_months DECIMAL(8,2) NOT NULL,
  debt_ratio DECIMAL(5,2) NOT NULL, -- (liabilities / assets) * 100
  active_income_engines INTEGER NOT NULL,
  freedom_score DECIMAL(5,2) NOT NULL, -- calculated score (0-100)
  runway_months DECIMAL(8,2), -- months until money runs out

  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_snapshots_user_date ON freedom_snapshots(user_id, snapshot_date DESC);
```

### 7. monthly_expenses
Track actual monthly expenses for rolling 3-month average calculation
```sql
CREATE TABLE monthly_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expense_month DATE NOT NULL, -- First day of month (YYYY-MM-01)
  total_amount DECIMAL(12,2) NOT NULL,

  -- Optional expense breakdown
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

CREATE INDEX idx_monthly_expenses_user_month ON monthly_expenses(user_id, expense_month DESC);
```

### 8. simulation_scenarios
Store "what-if" scenarios for decision support
```sql
CREATE TABLE simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Changes to simulate
  additional_income DECIMAL(12,2) DEFAULT 0,
  additional_investment DECIMAL(12,2) DEFAULT 0,
  investment_roi DECIMAL(5,2) DEFAULT 0,
  debt_payoff_amount DECIMAL(12,2) DEFAULT 0,
  living_cost_change DECIMAL(12,2) DEFAULT 0,

  -- Results
  current_freedom_date DATE,
  projected_freedom_date DATE,
  months_accelerated INTEGER,
  projected_freedom_score DECIMAL(5,2),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scenarios_user ON simulation_scenarios(user_id);
```

## Freedom Score Calculation Formula (Updated)

### Core Formulas

```
1. LivingCost = AVERAGE(last_3_months_expenses)
2. PassiveIncome = SUM(passive_sources) + SUM(semi_passive_sources)
3. CoverageRatio = PassiveIncome / LivingCost
4. Runway = LiquidAssets / LivingCost
5. FreedomScore = Weighted combination of 4 components
```

### Freedom Score Components

```
Freedom Score = (
  Coverage_Ratio_Score * 0.40 +
  Runway_Score * 0.30 +
  Debt_Ratio_Score * 0.20 +
  Asset_Productivity_Score * 0.10
)

Where:
- Coverage_Ratio_Score = MIN(100, coverage_ratio * 100)
- Runway_Score = MIN(100, (runway / 12) * 100)  [12 months = 100 points]
- Debt_Ratio_Score = MAX(0, 100 - (debt_ratio * 100))
- Asset_Productivity_Score = MIN(100, (monthly_yield/total_assets / 0.01) * 100)  [1% monthly = 100 points]
```

### Additional Metrics

```
- DebtRatio = TotalLiabilities / TotalAssets
- AssetProductivity = TotalMonthlyYield / TotalAssets
- MonthsToFreedom = LOG(living_cost / passive_income) / LOG(1 + monthly_growth_rate)
```

## Key Relationships

1. One User → One Financial Profile
2. One User → Many Income Engines
3. One User → Many Assets
4. One User → Many Liabilities
5. One User → Many Monthly Expenses
6. One User → Many Freedom Snapshots (time series)
7. One User → Many Simulation Scenarios

## Indexes Strategy

- Primary keys on all tables (UUID)
- Foreign key indexes for all user_id columns
- Composite index on (user_id, snapshot_date) for time-series queries
- Type/category indexes for filtering
