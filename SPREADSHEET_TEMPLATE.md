# Freedom Calculator Spreadsheet Template

Copy the tables below into Google Sheets or Excel. Formulas are provided in parentheses.

---

## Sheet 1: Monthly Expenses Tracker

| Month | Total Expenses | Housing | Food | Transportation | Utilities | Insurance | Healthcare | Entertainment | Other |
|-------|----------------|---------|------|----------------|-----------|-----------|------------|---------------|-------|
| Nov 2025 | $3,200 | $1,200 | $400 | $300 | $150 | $200 | $100 | $250 | $600 |
| Dec 2025 | $3,500 | $1,200 | $450 | $350 | $180 | $200 | $120 | $300 | $700 |
| Jan 2026 | $3,100 | $1,200 | $380 | $280 | $140 | $200 | $110 | $290 | $500 |
| | | | | | | | | | |
| **3-Month Average** | **$3,267** | | | | | | | | |

**Formula for B5:** `=AVERAGE(B2:B4)`

---

## Sheet 2: Income Sources

| Source | Type | Monthly Amount | Annual Growth % | Stability (1-10) |
|--------|------|----------------|-----------------|------------------|
| Day Job | active | $5,000 | 3% | 8 |
| Rental Property | semi_passive | $800 | 2% | 7 |
| Dividend Stocks | passive | $200 | 8% | 6 |
| YouTube Revenue | semi_passive | $150 | 15% | 5 |
| | | | | |
| **Total Active Income** | | **$5,000** | | |
| **Total Passive Income** | | **$1,150** | | |

**Formula for C7:** `=SUMIF(B2:B5,"active",C2:C5)`

**Formula for C8:** `=SUMIF(B2:B5,"passive",C2:C5)+SUMIF(B2:B5,"semi_passive",C2:C5)`

---

## Sheet 3: Assets

| Asset | Value | Monthly Yield | Category | Is Liquid |
|-------|-------|---------------|----------|-----------|
| Emergency Savings | $20,000 | $50 | savings | ✓ |
| Stock Portfolio | $15,000 | $200 | stocks | ✓ |
| Rental Property | $150,000 | $800 | real_estate | ✗ |
| Retirement Account | $35,000 | $0 | retirement | ✗ |
| | | | | |
| **Liquid Assets** | **$35,000** | | | |
| **Total Assets** | **$220,000** | | | |
| **Total Monthly Yield** | | **$1,050** | | |

**Formula for B7:** `=SUMIF(E2:E5,"✓",B2:B5)`

**Formula for B8:** `=SUM(B2:B5)`

**Formula for C9:** `=SUM(C2:C5)`

---

## Sheet 4: Liabilities

| Liability | Remaining Amount | Interest Rate % | Monthly Payment | Type |
|-----------|------------------|-----------------|-----------------|------|
| Mortgage | $120,000 | 3.5% | $800 | mortgage |
| Car Loan | $8,000 | 4.2% | $250 | car_loan |
| | | | | |
| **Total Liabilities** | **$128,000** | | | |
| **Total Monthly Payment** | | | **$1,050** | |

**Formula for B4:** `=SUM(B2:B3)`

**Formula for D5:** `=SUM(D2:D3)`

---

## Sheet 5: Freedom Metrics (THE MAIN DASHBOARD)

### Core Formulas

| Metric | Formula | Value | Interpretation |
|--------|---------|-------|----------------|
| **1. Living Cost** | =Sheet1!B5 | **$3,267** | 3-month rolling average |
| **2. Passive Income** | =Sheet2!C8 | **$1,150** | Passive + Semi-Passive |
| **3. Coverage Ratio** | =B2/B1 | **35.2%** | 35.2% to freedom |
| **4. Liquid Assets** | =Sheet3!B7 | **$35,000** | Emergency fund |
| **5. Runway (months)** | =B4/B1 | **10.7** | Months of safety |

---

### Supporting Metrics

| Metric | Formula | Value |
|--------|---------|-------|
| Total Assets | =Sheet3!B8 | $220,000 |
| Total Liabilities | =Sheet4!B4 | $128,000 |
| Net Worth | =B11-B12 | $92,000 |
| Debt Ratio | =B12/B11 | 58.2% |
| Asset Productivity | =Sheet3!C9/B11 | 0.48%/mo |

---

### Freedom Score Calculation

| Component | Weight | Calculation | Raw Score | Weighted Score |
|-----------|--------|-------------|-----------|----------------|
| **Coverage Ratio** | 40% | MIN(100, B3*100) | 35.2 | **14.1** |
| **Runway** | 30% | MIN(100, (B5/12)*100) | 89.2 | **26.8** |
| **Debt Ratio** | 20% | MAX(0, 100-(B14*100)) | 41.8 | **8.4** |
| **Asset Productivity** | 10% | MIN(100, (B15/0.01)*100) | 47.7 | **4.8** |
| | | | | |
| **FREEDOM SCORE** | **100%** | | | **54.1** |

**Final Score Formula:** `=(B22*0.4)+(B23*0.3)+(B24*0.2)+(B25*0.1)`

---

### Score Interpretation Guide

| Score Range | Status | Description |
|-------------|--------|-------------|
| 0 - 29 | Starting | Focus on foundation building |
| 30 - 49 | Building | Early-stage momentum |
| 50 - 69 | Fair | Solid progress made |
| 70 - 84 | Good | Approaching freedom |
| 85 - 100 | Excellent | At or near freedom |

**Your Status:** Fair (Score: 54.1)

---

### Path to Financial Freedom

| Goal | Target | Current | Gap | Action Needed |
|------|--------|---------|-----|---------------|
| Coverage Ratio | 100% | 35.2% | 64.8% | +$2,117/mo passive income |
| Runway | 12 months | 10.7 months | 1.3 months | +$5,204 liquid savings |
| Debt Ratio | <20% | 58.2% | 38.2% | Pay $84,000 debt or grow assets |
| Income Engines | 2+ | 3 | ✓ | Target met! |

---

### Months to Freedom Calculator

| Item | Value | Formula |
|------|-------|---------|
| Current Passive Income | $1,150 | =Sheet2!C8 |
| Target Income | $3,267 | =B1 |
| Monthly Growth Rate | 0.5% | Average from growth rates |
| **Months to Freedom** | **225** | =LOG(B51/B50)/LOG(1+(B52/100)) |
| **Years to Freedom** | **18.75 years** | =B53/12 |

---

## Quick Actions to Accelerate Freedom

| Action | Impact on Timeline | Impact on Score |
|--------|-------------------|-----------------|
| Add $500/mo passive income | -60 months (~5 years) | +15 points |
| Reduce living cost by 20% | -50 months (~4 years) | +12 points |
| Pay off $50k debt | No time impact | +15 points |
| Build liquid assets to $40k | No time impact | +3 points |
| Start 2 more passive income streams | -40 months (~3 years) | +8 points |

---

## How to Use This Template

1. **Copy to Google Sheets or Excel**
2. **Fill in your actual data** in Sheets 1-4
3. **Sheet 5 auto-calculates** your Freedom Score
4. **Update monthly** to track progress
5. **Use simulator** to test "what-if" scenarios

---

## Formula Reference

### 1. Living Cost (3-Month Rolling Average)
```
=AVERAGE(last_3_months_expenses)
```

### 2. Passive Income
```
=SUMIF(income_type, "passive", amounts) + SUMIF(income_type, "semi_passive", amounts)
```

### 3. Coverage Ratio
```
=passive_income / living_cost
```

### 4. Runway
```
=liquid_assets / living_cost
```

### 5. Freedom Score
```
= (coverage_ratio_score * 0.40) +
  (runway_score * 0.30) +
  (debt_ratio_score * 0.20) +
  (asset_productivity_score * 0.10)
```

Where each component score is calculated as:
- **Coverage Ratio Score:** `MIN(100, coverage_ratio * 100)`
- **Runway Score:** `MIN(100, (runway / 12) * 100)`
- **Debt Ratio Score:** `MAX(0, 100 - (debt_ratio * 100))`
- **Asset Productivity Score:** `MIN(100, (productivity / 0.01) * 100)`

---

## Pro Tips

1. **Track expenses accurately** - Your freedom score depends on accurate living cost
2. **Update monthly** - Trends matter more than point-in-time data
3. **Focus on passive income** - This is the only metric that truly buys freedom
4. **Reduce expenses strategically** - Every $100/mo cut = $100/mo less passive income needed
5. **Build liquid runway first** - Security enables risk-taking for income growth
6. **Debt under 20%** - Above this, focus on payoff before asset growth
7. **Diversify income** - Multiple streams reduce risk significantly

---

**Financial Freedom = Passive Income ≥ Living Cost + Emergency Fund Secured**
