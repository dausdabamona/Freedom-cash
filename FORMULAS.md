# Financial Freedom Formulas

## Core Calculation Formulas

### 1. Living Cost (Rolling 3-Month Average)

**Formula:**
```
LivingCost = (Month1_Expenses + Month2_Expenses + Month3_Expenses) / 3
```

**Spreadsheet:**
```
=AVERAGE(B2:B4)  // Where B2:B4 contains last 3 months expenses
```

**Logic:**
- Takes actual expenses from last 3 months
- Averages them to smooth out variations
- More accurate than single month estimate

---

### 2. Passive Income

**Formula:**
```
PassiveIncome = SUM(Passive_Sources) + SUM(Semi_Passive_Sources)
```

**Spreadsheet:**
```
=SUMIF(IncomeType, "passive", Amount) + SUMIF(IncomeType, "semi_passive", Amount)
```

**Logic:**
- Includes fully passive income (dividends, royalties, automated businesses)
- Includes semi-passive income (managed rentals, part-time consulting)
- Excludes active income (salary, hourly work)

---

### 3. Coverage Ratio

**Formula:**
```
CoverageRatio = PassiveIncome / LivingCost
```

**Spreadsheet:**
```
=B10/B5  // Where B10 = PassiveIncome, B5 = LivingCost
```

**Interpretation:**
- `1.00 (100%)` = Financial Freedom Achieved
- `0.75 (75%)` = 75% of living costs covered
- `0.50 (50%)` = Halfway to freedom
- `0.25 (25%)` = Early stage

**Milestones:**
- 0% - 25%: Building Foundation
- 25% - 50%: Gaining Momentum
- 50% - 75%: Approaching Freedom
- 75% - 100%: Final Push
- 100%+: Financial Freedom Achieved

---

### 4. Runway

**Formula:**
```
Runway = LiquidAssets / LivingCost
```

**Spreadsheet:**
```
=B15/B5  // Where B15 = LiquidAssets, B5 = LivingCost
// Result in months
```

**Logic:**
- LiquidAssets = Cash + Savings + Money Market + Easily sellable assets
- Measures how many months you can survive without income
- Essential safety metric

**Targets:**
- 3 months: Minimum emergency fund
- 6 months: Comfortable buffer
- 12 months: Strong security
- 24+ months: Exceptional runway

---

### 5. Freedom Score (0-100)

**Formula:**
```
FreedomScore =
  (CoverageRatio_Score × 0.40) +
  (Runway_Score × 0.30) +
  (DebtRatio_Score × 0.20) +
  (AssetProductivity_Score × 0.10)
```

**Component Calculations:**

#### 5.1 Coverage Ratio Score (40% weight)
```
CoverageRatio_Score = MIN(100, CoverageRatio × 100)
```
Spreadsheet: `=MIN(100, B20*100)`

#### 5.2 Runway Score (30% weight)
```
Runway_Score = MIN(100, (Runway / 12) × 100)
```
Spreadsheet: `=MIN(100, (B25/12)*100)`
- 12 months runway = 100 points
- 6 months runway = 50 points
- 3 months runway = 25 points

#### 5.3 Debt Ratio Score (20% weight)
```
DebtRatio = TotalLiabilities / TotalAssets
DebtRatio_Score = MAX(0, 100 - (DebtRatio × 100))
```
Spreadsheet: `=MAX(0, 100-(B30*100))`
- 0% debt = 100 points
- 20% debt = 80 points
- 50% debt = 50 points
- 100% debt = 0 points

#### 5.4 Asset Productivity Score (10% weight)
```
AssetProductivity = Total_Monthly_Yield / Total_Asset_Value
AssetProductivity_Score = MIN(100, (AssetProductivity / 0.01) × 100)
```
Spreadsheet: `=MIN(100, (B35/0.01)*100)`
- 1% monthly yield = 100 points (12% annual)
- 0.5% monthly yield = 50 points (6% annual)
- 0.25% monthly yield = 25 points (3% annual)

---

## Complete Spreadsheet Example

### Sheet 1: Monthly Expenses Tracker

| Month | Total Expenses |
|-------|----------------|
| Jan 2026 | $3,200 |
| Feb 2026 | $3,500 |
| Mar 2026 | $3,100 |
| **3-Month Avg** | **=AVERAGE(B2:B4)** → $3,267 |

### Sheet 2: Income Sources

| Source | Type | Monthly Amount |
|--------|------|----------------|
| Day Job | active | $5,000 |
| Rental Property | semi_passive | $800 |
| Dividend Stocks | passive | $200 |
| YouTube Revenue | semi_passive | $150 |
| **Passive Total** | | **=SUMIF(B2:B5,"passive",C2:C5)+SUMIF(B2:B5,"semi_passive",C2:C5)** → $1,150 |

### Sheet 3: Assets

| Asset | Value | Monthly Yield | Category |
|-------|-------|---------------|----------|
| Savings | $20,000 | $50 | liquid |
| Stocks | $15,000 | $200 | liquid |
| Rental Property | $150,000 | $800 | illiquid |
| **Liquid Assets** | | **=SUMIF(D2:D4,"liquid",B2:B4)** → $35,000 |
| **Total Assets** | | **=SUM(B2:B4)** → $185,000 |
| **Total Yield** | | **=SUM(C2:C4)** → $1,050 |

### Sheet 4: Liabilities

| Liability | Amount |
|-----------|--------|
| Mortgage | $120,000 |
| Car Loan | $8,000 |
| **Total Liabilities** | **=SUM(B2:B3)** → $128,000 |

### Sheet 5: Freedom Metrics

| Metric | Formula | Value |
|--------|---------|-------|
| **Living Cost (3mo avg)** | =Sheet1!B5 | $3,267 |
| **Passive Income** | =Sheet2!C7 | $1,150 |
| **Coverage Ratio** | =B2/B1 | 35.2% |
| **Liquid Assets** | =Sheet3!B5 | $35,000 |
| **Runway (months)** | =B4/B1 | 10.7 |
| | | |
| **Total Assets** | =Sheet3!B6 | $185,000 |
| **Total Liabilities** | =Sheet4!B4 | $128,000 |
| **Debt Ratio** | =B8/B7 | 69.2% |
| | | |
| **Total Yield** | =Sheet3!C6 | $1,050 |
| **Asset Productivity** | =B10/B7 | 0.57% |
| | | |
| **Coverage Score (40%)** | =MIN(100,B3*100) | 35.2 |
| **Runway Score (30%)** | =MIN(100,(B5/12)*100) | 89.2 |
| **Debt Score (20%)** | =MAX(0,100-(B9*100)) | 30.8 |
| **Productivity Score (10%)** | =MIN(100,(B11/0.01)*100) | 57.0 |
| | | |
| **FREEDOM SCORE** | =(B13*0.4)+(B14*0.3)+(B15*0.2)+(B16*0.1) | **47.6** |

---

## Freedom Score Breakdown Table

| Component | Weight | Calculation | Raw Score | Weighted |
|-----------|--------|-------------|-----------|----------|
| Coverage Ratio | 40% | PassiveIncome/LivingCost × 100 | 35.2 | 14.1 |
| Runway | 30% | (LiquidAssets/LivingCost)/12 × 100 | 89.2 | 26.8 |
| Debt Ratio | 20% | 100 - (Liabilities/Assets × 100) | 30.8 | 6.2 |
| Asset Productivity | 10% | (MonthlyYield/Assets)/0.01 × 100 | 57.0 | 5.7 |
| **TOTAL** | **100%** | | | **52.8** |

---

## Key Thresholds

### Financial Freedom Checkpoints

| Metric | Minimum | Good | Excellent |
|--------|---------|------|-----------|
| Coverage Ratio | 50% | 75% | 100%+ |
| Runway | 6 months | 12 months | 24 months |
| Debt Ratio | <50% | <30% | <20% |
| Asset Productivity | 0.25%/mo | 0.5%/mo | 1%/mo |
| Freedom Score | 50 | 70 | 85+ |

### Financial Freedom = Coverage Ratio ≥ 100%

When your passive income covers 100% of your living costs, you are financially free.

---

## Usage in Code

See `backend/src/utils/freedomFormulas.ts` for implementation.

## Usage in Spreadsheet

1. Copy the sheet structure above
2. Enter your monthly expenses in Sheet 1
3. Enter your income sources in Sheet 2
4. Enter your assets in Sheet 3
5. Enter your liabilities in Sheet 4
6. Sheet 5 automatically calculates your Freedom Score
