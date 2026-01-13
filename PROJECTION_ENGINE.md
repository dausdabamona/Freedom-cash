# Financial Freedom Projection Engine

## Overview

The Projection Engine calculates your path to financial freedom using compound growth formulas and projects when **PassiveIncome ≥ LivingCost** will be achieved.

It provides **3 scenarios** to help you plan realistically:
1. **Optimistic** - Above-average growth
2. **Realistic** - Expected growth
3. **Conservative** - Below-average growth

---

## Core Formula

The engine applies **compound monthly growth** until freedom is achieved:

```
Each Month:
  PassiveIncome = PassiveIncome × (1 + monthly_growth_rate) + monthly_income_increase
  LivingCost = LivingCost × (1 + monthly_inflation_rate)
  LiquidAssets = LiquidAssets × (1 + monthly_asset_growth) + monthly_investment

Freedom Achieved When:
  CoverageRatio = PassiveIncome / LivingCost ≥ 1.00 (100%)
```

### Annual to Monthly Conversion

Annual rates are converted to monthly compound rates:
```
monthly_rate = (1 + annual_rate/100)^(1/12) - 1
```

Example: 10% annual = 0.7974% monthly compound rate

---

## Scenario Definitions

### Optimistic Scenario
- Passive income growth: **1.5× base rate**
- Living cost inflation: **0.5× base rate**
- Asset growth: **1.3× base rate**
- Monthly investment: **1.2× base amount**
- Monthly income increase: **1.3× base amount**

**Use case:** Best-case planning, understanding maximum potential

### Realistic Scenario
- Passive income growth: **1.0× base rate** (as provided)
- Living cost inflation: **1.0× base rate** (as provided)
- Asset growth: **1.0× base rate** (as provided)
- Monthly investment: **1.0× base amount** (as provided)
- Monthly income increase: **1.0× base amount** (as provided)

**Use case:** Primary planning scenario, expected outcome

### Conservative Scenario
- Passive income growth: **0.6× base rate**
- Living cost inflation: **1.5× base rate**
- Asset growth: **0.7× base rate**
- Monthly investment: **0.8× base amount**
- Monthly income increase: **0.7× base amount**

**Use case:** Risk management, worst-case planning

---

## API Endpoints

### 1. Quick Projection (GET)

**Endpoint:** `GET /api/projections/quick?user_id=<id>`

Calculates projections using current financial state from database.

**Response:**
```json
{
  "currentCoverageRatio": 0.352,
  "scenarios": {
    "optimistic": {
      "freedomDate": "2029-03",
      "yearsToFreedom": 3.2,
      "monthsToFreedom": 38
    },
    "realistic": {
      "freedomDate": "2032-06",
      "yearsToFreedom": 6.5,
      "monthsToFreedom": 78
    },
    "conservative": {
      "freedomDate": "2038-11",
      "yearsToFreedom": 12.9,
      "monthsToFreedom": 155
    }
  },
  "assumptions": {
    "optimistic": [
      "Passive income grows at 12.0% annually",
      "Living costs increase at 1.5% annually",
      ...
    ],
    "realistic": [...],
    "conservative": [...]
  }
}
```

---

### 2. Full Projection Calculation (POST)

**Endpoint:** `POST /api/projections/calculate`

Calculate custom projections with specified parameters.

**Request Body:**
```json
{
  "user_id": "demo-user",
  "currentPassiveIncome": 1150,
  "currentLivingCost": 3267,
  "currentLiquidAssets": 35000,
  "passiveIncomeGrowthRate": 8,  // Annual %
  "livingCostInflationRate": 3,   // Annual %
  "assetGrowthRate": 6,           // Annual %
  "monthlyInvestment": 500,       // $ per month
  "monthlyIncomeIncrease": 100    // $ per month
}
```

**Response:**
```json
{
  "currentState": {
    "passiveIncome": 1150,
    "livingCost": 3267,
    "coverageRatio": 0.352,
    "liquidAssets": 35000,
    "runway": 10.7
  },
  "scenarios": {
    "optimistic": {
      "name": "Optimistic",
      "description": "Above-average growth with favorable conditions",
      "freedomDate": "2029-03",
      "monthsToFreedom": 38,
      "yearsToFreedom": 3.2,
      "finalPassiveIncome": 3450,
      "finalLivingCost": 3401,
      "finalCoverageRatio": 1.014,
      "finalLiquidAssets": 67890,
      "monthlyProjections": [...],
      "milestones": [...]
    },
    "realistic": {...},
    "conservative": {...}
  },
  "assumptions": {...},
  "comparison": [
    {
      "metric": "Freedom Date",
      "optimistic": "2029-03",
      "realistic": "2032-06",
      "conservative": "2038-11"
    },
    ...
  ]
}
```

---

### 3. Monthly Breakdown (GET)

**Endpoint:** `GET /api/projections/monthly/<scenario>?user_id=<id>`

Get month-by-month projections for a specific scenario.

**Parameters:**
- `scenario`: `optimistic`, `realistic`, or `conservative`

**Response:**
```json
{
  "scenario": {
    "name": "Realistic",
    "freedomDate": "2032-06",
    "monthlyProjections": [
      {
        "month": 1,
        "date": "2026-02",
        "passiveIncome": 1158,
        "livingCost": 3275,
        "liquidAssets": 35210,
        "coverageRatio": 0.354,
        "runway": 10.75,
        "isFree": false
      },
      {
        "month": 2,
        "date": "2026-03",
        "passiveIncome": 1166,
        ...
      },
      ...
      {
        "month": 78,
        "date": "2032-06",
        "passiveIncome": 3890,
        "livingCost": 3854,
        "coverageRatio": 1.009,
        "isFree": true
      }
    ],
    "milestones": [
      {
        "month": 18,
        "date": "2027-08",
        "type": "milestone",
        "description": "Foundation Built - 25% coverage",
        "coverageRatio": 0.251
      },
      {
        "month": 42,
        "date": "2029-08",
        "type": "milestone",
        "description": "Halfway to Freedom - 50% coverage",
        "coverageRatio": 0.502
      },
      ...
    ]
  }
}
```

---

### 4. Compare Scenarios (POST)

**Endpoint:** `POST /api/projections/compare`

Compare multiple "what-if" scenarios side by side.

**Request Body:**
```json
{
  "scenarios": [
    {
      "name": "Current Path",
      "currentPassiveIncome": 1150,
      "currentLivingCost": 3267,
      "currentLiquidAssets": 35000,
      "passiveIncomeGrowthRate": 8
    },
    {
      "name": "With Side Business",
      "currentPassiveIncome": 1650,
      "currentLivingCost": 3267,
      "currentLiquidAssets": 35000,
      "passiveIncomeGrowthRate": 10,
      "description": "Start $500/mo side business with 10% growth"
    },
    {
      "name": "Reduce Expenses",
      "currentPassiveIncome": 1150,
      "currentLivingCost": 2600,
      "currentLiquidAssets": 35000,
      "passiveIncomeGrowthRate": 8,
      "description": "Cut living costs by 20%"
    }
  ]
}
```

**Response:**
```json
{
  "scenarios": [
    {
      "name": "Current Path",
      "realistic": {
        "freedomDate": "2032-06",
        "yearsToFreedom": 6.5
      }
    },
    {
      "name": "With Side Business",
      "realistic": {
        "freedomDate": "2029-08",
        "yearsToFreedom": 3.7
      }
    },
    {
      "name": "Reduce Expenses",
      "realistic": {
        "freedomDate": "2030-11",
        "yearsToFreedom": 4.9
      }
    }
  ],
  "comparison": [
    {
      "name": "Current Path",
      "freedomDate": "2032-06",
      "yearsToFreedom": 6.5,
      "finalPassiveIncome": 3890
    },
    ...
  ]
}
```

---

### 5. Milestones (POST)

**Endpoint:** `POST /api/projections/milestones`

Get key milestones on the path to freedom.

**Response:**
```json
{
  "optimistic": [
    {
      "month": 12,
      "date": "2027-02",
      "type": "milestone",
      "description": "Foundation Built - 25% coverage",
      "coverageRatio": 0.25
    },
    {
      "month": 24,
      "date": "2028-02",
      "type": "milestone",
      "description": "Halfway to Freedom - 50% coverage",
      "coverageRatio": 0.50
    },
    {
      "month": 33,
      "date": "2028-11",
      "type": "milestone",
      "description": "Final Push - 75% coverage reached",
      "coverageRatio": 0.75
    },
    {
      "month": 38,
      "date": "2029-03",
      "type": "freedom",
      "description": "Financial Freedom Achieved! 🎉",
      "coverageRatio": 1.00
    }
  ],
  "realistic": [...],
  "conservative": [...]
}
```

---

## Usage Examples

### Example 1: Basic Projection

```bash
# Get quick projection using current data
curl http://localhost:3001/api/projections/quick?user_id=demo-user
```

### Example 2: Custom Projection

```bash
curl -X POST http://localhost:3001/api/projections/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassiveIncome": 1200,
    "currentLivingCost": 3000,
    "currentLiquidAssets": 40000,
    "passiveIncomeGrowthRate": 10,
    "monthlyInvestment": 500
  }'
```

### Example 3: Compare Options

```bash
curl -X POST http://localhost:3001/api/projections/compare \
  -H "Content-Type: application/json" \
  -d '{
    "scenarios": [
      {
        "name": "Base Case",
        "currentPassiveIncome": 1000,
        "currentLivingCost": 3000,
        "passiveIncomeGrowthRate": 8
      },
      {
        "name": "Aggressive Growth",
        "currentPassiveIncome": 1000,
        "currentLivingCost": 3000,
        "passiveIncomeGrowthRate": 15
      }
    ]
  }'
```

---

## Key Milestones

The engine tracks these coverage ratio milestones:

| Coverage | Milestone | Description |
|----------|-----------|-------------|
| 25% | Foundation Built | Quarter of the way there |
| 50% | Halfway Point | Solid progress made |
| 75% | Final Push | Almost there! |
| 100% | **Freedom Achieved** | 🎉 Passive income covers living costs |

---

## Interpretation Guide

### Years to Freedom

| Years | Status | Action |
|-------|--------|--------|
| < 3 years | Excellent | Stay the course |
| 3-5 years | Very Good | Consider accelerators |
| 5-10 years | Good | Look for optimization |
| 10-15 years | Fair | Increase income or reduce costs |
| 15-20 years | Needs Work | Major strategy change needed |
| > 20 years | Critical | Fundamental rethink required |

### Scenario Spread

If the difference between optimistic and conservative is:
- **< 5 years**: Stable, predictable path
- **5-10 years**: Moderate uncertainty
- **> 10 years**: High uncertainty, need backup plans

---

## Growth Rate Guidelines

### Passive Income Growth (Annual)

| Rate | Source Example | Realistic? |
|------|----------------|------------|
| 3-5% | Bonds, savings | Very Conservative |
| 6-8% | Dividend stocks, REITs | Conservative |
| 10-12% | Rental properties, index funds | Realistic |
| 15-20% | Growing businesses, startups | Optimistic |
| > 20% | High-growth ventures | Very Optimistic |

### Asset Growth (Annual)

| Rate | Asset Type | Typical Range |
|------|------------|---------------|
| 0-2% | Savings accounts | Very Safe |
| 4-6% | Bonds, CDs | Safe |
| 7-10% | Stock market (S&P 500 historical) | Moderate |
| 10-15% | Real estate appreciation | Market-dependent |
| > 15% | High-risk investments | Speculative |

### Living Cost Inflation (Annual)

| Rate | Context | Realistic? |
|------|---------|------------|
| 2-3% | Normal inflation | Typical |
| 4-5% | High inflation period | Possible |
| > 5% | Crisis conditions | Rare |

---

## Formula Deep Dive

### Compound Growth Formula

```
Future Value = Present Value × (1 + rate)^periods

For monthly compounding:
  monthly_rate = (1 + annual_rate)^(1/12) - 1
  future_value = present_value × (1 + monthly_rate)^months
```

### Months to Freedom

```
PassiveIncome(t) = PassiveIncome(0) × (1 + growth)^t
LivingCost(t) = LivingCost(0) × (1 + inflation)^t

Freedom when:
  PassiveIncome(t) = LivingCost(t)

Solving for t:
  PassiveIncome(0) × (1 + g)^t = LivingCost(0) × (1 + i)^t
  (1 + g)^t / (1 + i)^t = LivingCost(0) / PassiveIncome(0)
  ((1 + g) / (1 + i))^t = LivingCost(0) / PassiveIncome(0)

  t = log(LivingCost(0) / PassiveIncome(0)) / log((1 + g) / (1 + i))
```

---

## Best Practices

1. **Use Realistic Scenario for Planning**
   - Base financial decisions on realistic projections
   - Use optimistic for motivation
   - Use conservative for risk management

2. **Update Quarterly**
   - Recalculate projections every 3 months
   - Adjust growth rates based on actual performance
   - Track variance from projections

3. **Focus on Control**
   - You control: living costs, monthly investment
   - Partially control: income growth (effort-dependent)
   - Don't control: inflation, market returns

4. **Multiple Paths**
   - Don't rely on single scenario
   - Plan for conservative, hope for realistic
   - Be prepared to adapt

5. **Action Triggers**
   - If falling behind realistic: increase income or cut costs
   - If ahead of realistic: consider increasing runway
   - If hitting conservative: major intervention needed

---

## Code Implementation

See `backend/src/utils/projectionEngine.ts` for complete implementation.

Key functions:
- `projectFreedomPath()` - Main projection function
- `generateProjection()` - Month-by-month calculation
- `extractMilestones()` - Identify key milestones
- `compareScenarios()` - Side-by-side comparison
