import express from 'express';
import pool from '../db/connection';
import { calculateAllMetrics, type FreedomInput } from '../utils/freedomFormulas';
import { projectFreedomPath, type ProjectionInput } from '../utils/projectionEngine';

const router = express.Router();

/**
 * GET /api/freedom/summary
 * Freedom Dashboard - All key metrics in one endpoint
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';

    // 1. Get financial profile settings
    const profileResult = await pool.query(
      'SELECT * FROM financial_profiles WHERE user_id = $1',
      [userId]
    );

    const monthlyLivingCost = parseFloat(profileResult.rows[0]?.monthly_living_cost || '0');

    // 2. Get last 3 months expenses
    const expensesResult = await pool.query(
      `SELECT expense_month, total_amount as amount
       FROM monthly_expenses
       WHERE user_id = $1
       ORDER BY expense_month DESC
       LIMIT 3`,
      [userId]
    );

    const monthlyExpenses = expensesResult.rows.map(row => ({
      month: row.expense_month,
      amount: parseFloat(row.amount),
    }));

    // 3. Get all income sources
    const incomeResult = await pool.query(
      `SELECT type, monthly_amount
       FROM income_engines
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );

    const incomeSources = incomeResult.rows.map(row => ({
      type: row.type as 'active' | 'semi_passive' | 'passive',
      monthlyAmount: parseFloat(row.monthly_amount),
    }));

    // 4. Get all assets
    const assetsResult = await pool.query(
      `SELECT current_value as value, monthly_yield, is_liquid
       FROM assets
       WHERE user_id = $1`,
      [userId]
    );

    const assets = assetsResult.rows.map(row => ({
      value: parseFloat(row.value),
      monthlyYield: parseFloat(row.monthly_yield || '0'),
      isLiquid: row.is_liquid || false,
    }));

    // 5. Get total liabilities
    const liabilitiesResult = await pool.query(
      `SELECT COALESCE(SUM(remaining_balance), 0) as total
       FROM liabilities
       WHERE user_id = $1`,
      [userId]
    );

    const totalLiabilities = parseFloat(liabilitiesResult.rows[0]?.total || '0');

    // 6. Calculate all current metrics
    const freedomInput: FreedomInput = {
      monthlyExpenses,
      incomeSources,
      assets,
      totalLiabilities,
    };

    const metrics = calculateAllMetrics(freedomInput);

    // Use monthly living cost from profile if no expense history
    const livingCost = metrics.livingCost > 0 ? metrics.livingCost : monthlyLivingCost;

    // 7. Calculate passive income and active income separately
    const passiveIncome = metrics.passiveIncome;
    const activeIncome = incomeSources
      .filter(source => source.type === 'active')
      .reduce((total, source) => total + source.monthlyAmount, 0);

    // 8. Get average growth rate for projections
    const growthResult = await pool.query(
      `SELECT AVG(growth_rate) as avg_growth
       FROM income_engines
       WHERE user_id = $1 AND is_active = true AND type IN ('passive', 'semi_passive')`,
      [userId]
    );

    const avgGrowthRate = parseFloat(growthResult.rows[0]?.avg_growth || '8');

    // 9. Run projection engine
    const projectionInput: ProjectionInput = {
      currentPassiveIncome: passiveIncome,
      currentLivingCost: livingCost,
      currentLiquidAssets: metrics.liquidAssets,
      passiveIncomeGrowthRate: avgGrowthRate,
      livingCostInflationRate: 3,
      assetGrowthRate: 0,
      monthlyInvestment: 0,
      monthlyIncomeIncrease: 0,
    };

    const projection = projectFreedomPath(projectionInput);

    // 10. Calculate coverage ratio and freedom progress
    const coverageRatio = livingCost > 0 ? passiveIncome / livingCost : 0;
    const coveragePercent = Math.round(coverageRatio * 100);
    const freedomProgress = Math.min(100, coveragePercent); // Cap at 100%

    // 11. Determine color status
    let status: 'free' | 'approaching' | 'building';
    let color: 'green' | 'yellow' | 'red';

    if (coverageRatio >= 1.0) {
      status = 'free';
      color = 'green';
    } else if (coverageRatio >= 0.5) {
      status = 'approaching';
      color = 'yellow';
    } else {
      status = 'building';
      color = 'red';
    }

    // 12. Build response
    res.json({
      // Core metrics
      monthlyLivingCost: Math.round(livingCost * 100) / 100,
      passiveIncome: Math.round(passiveIncome * 100) / 100,
      activeIncome: Math.round(activeIncome * 100) / 100,
      coverageRatio: coverageRatio,
      coveragePercent: coveragePercent,

      // Freedom progress
      freedomProgress: freedomProgress,
      status: status,
      color: color,

      // Projected dates for all scenarios
      projectedFreedomDate: {
        optimistic: projection.scenarios.optimistic.freedomDate,
        realistic: projection.scenarios.realistic.freedomDate,
        conservative: projection.scenarios.conservative.freedomDate,
      },

      // Months to freedom for all scenarios
      monthsToFreedom: {
        optimistic: projection.scenarios.optimistic.monthsToFreedom,
        realistic: projection.scenarios.realistic.monthsToFreedom,
        conservative: projection.scenarios.conservative.monthsToFreedom,
      },

      // Years to freedom (formatted)
      yearsToFreedom: {
        optimistic: projection.scenarios.optimistic.yearsToFreedom,
        realistic: projection.scenarios.realistic.yearsToFreedom,
        conservative: projection.scenarios.conservative.yearsToFreedom,
      },

      // Additional context
      liquidAssets: Math.round(metrics.liquidAssets * 100) / 100,
      runway: Math.round(metrics.runway * 100) / 100,
      freedomScore: Math.round(metrics.freedomScore * 100) / 100,

      // Scenario details (for switching between scenarios)
      scenarios: {
        optimistic: {
          freedomDate: projection.scenarios.optimistic.freedomDate,
          monthsToFreedom: projection.scenarios.optimistic.monthsToFreedom,
          yearsToFreedom: projection.scenarios.optimistic.yearsToFreedom,
          finalPassiveIncome: Math.round(projection.scenarios.optimistic.finalPassiveIncome * 100) / 100,
          finalLivingCost: Math.round(projection.scenarios.optimistic.finalLivingCost * 100) / 100,
        },
        realistic: {
          freedomDate: projection.scenarios.realistic.freedomDate,
          monthsToFreedom: projection.scenarios.realistic.monthsToFreedom,
          yearsToFreedom: projection.scenarios.realistic.yearsToFreedom,
          finalPassiveIncome: Math.round(projection.scenarios.realistic.finalPassiveIncome * 100) / 100,
          finalLivingCost: Math.round(projection.scenarios.realistic.finalLivingCost * 100) / 100,
        },
        conservative: {
          freedomDate: projection.scenarios.conservative.freedomDate,
          monthsToFreedom: projection.scenarios.conservative.monthsToFreedom,
          yearsToFreedom: projection.scenarios.conservative.yearsToFreedom,
          finalPassiveIncome: Math.round(projection.scenarios.conservative.finalPassiveIncome * 100) / 100,
          finalLivingCost: Math.round(projection.scenarios.conservative.finalLivingCost * 100) / 100,
        },
      },

      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Freedom summary error:', error);
    res.status(500).json({ error: 'Failed to calculate freedom summary' });
  }
});

export default router;
