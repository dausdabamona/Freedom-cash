import express from 'express';
import pool from '../db/connection';
import {
  calculateAllMetrics,
  interpretFreedomScore,
  interpretCoverageRatio,
  calculateMonthsToFreedom,
  type MonthlyExpense,
  type IncomeSource,
  type Asset,
} from '../utils/freedomFormulas';

const router = express.Router();

/**
 * GET /api/dashboard/v2
 * Returns Freedom Dashboard using new formulas:
 * 1. LivingCost = rolling 3-month average
 * 2. PassiveIncome = passive + semi_passive
 * 3. CoverageRatio = PassiveIncome / LivingCost
 * 4. Runway = LiquidAssets / LivingCost
 * 5. FreedomScore = weighted score
 */
router.get('/v2', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';

    // Fetch last 3 months of expenses
    const expensesResult = await pool.query(
      `SELECT expense_month as month, total_amount as amount
       FROM monthly_expenses
       WHERE user_id = $1
       ORDER BY expense_month DESC
       LIMIT 3`,
      [userId]
    );

    const monthlyExpenses: MonthlyExpense[] = expensesResult.rows.map(row => ({
      month: row.month,
      amount: parseFloat(row.amount),
    }));

    // Fetch income sources
    const incomeResult = await pool.query(
      `SELECT type, monthly_amount
       FROM income_engines
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );

    const incomeSources: IncomeSource[] = incomeResult.rows.map(row => ({
      type: row.type,
      monthlyAmount: parseFloat(row.monthly_amount),
    }));

    // Fetch assets
    const assetsResult = await pool.query(
      `SELECT current_value, monthly_yield, is_liquid, category
       FROM assets
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );

    const assets: Asset[] = assetsResult.rows.map(row => ({
      value: parseFloat(row.current_value),
      monthlyYield: parseFloat(row.monthly_yield),
      // Default is_liquid based on category if not set
      isLiquid: row.is_liquid ?? ['savings', 'stocks', 'bonds', 'crypto'].includes(row.category),
    }));

    // Fetch total liabilities
    const liabilitiesResult = await pool.query(
      `SELECT SUM(remaining_amount) as total
       FROM liabilities
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );

    const totalLiabilities = parseFloat(liabilitiesResult.rows[0]?.total || '0');

    // Calculate all metrics using new formulas
    const metrics = calculateAllMetrics({
      monthlyExpenses,
      incomeSources,
      assets,
      totalLiabilities,
    });

    // Calculate active income separately
    const activeIncome = incomeSources
      .filter(s => s.type === 'active')
      .reduce((sum, s) => sum + s.monthlyAmount, 0);

    // Calculate semi-passive income separately
    const semiPassiveIncome = incomeSources
      .filter(s => s.type === 'semi_passive')
      .reduce((sum, s) => sum + s.monthlyAmount, 0);

    // Count income engines
    const activeIncomeEngines = incomeSources.length;

    // Get average monthly growth rate from income engines
    const growthResult = await pool.query(
      `SELECT AVG(growth_rate) as avg_growth
       FROM income_engines
       WHERE user_id = $1 AND is_active = true AND type IN ('passive', 'semi_passive')`,
      [userId]
    );

    const avgAnnualGrowth = parseFloat(growthResult.rows[0]?.avg_growth || '0');
    const avgMonthlyGrowth = avgAnnualGrowth / 12;

    // Calculate months to freedom
    const monthsToFreedom = calculateMonthsToFreedom(
      metrics.passiveIncome,
      metrics.livingCost,
      avgMonthlyGrowth
    );

    // Project freedom date
    let projectedFreedomDate = null;
    if (monthsToFreedom !== null) {
      const date = new Date();
      date.setMonth(date.getMonth() + monthsToFreedom);
      projectedFreedomDate = date.toISOString().split('T')[0];
    }

    // Get interpretations
    const scoreInterpretation = interpretFreedomScore(metrics.freedomScore);
    const coverageInterpretation = interpretCoverageRatio(metrics.coverageRatio);

    // Response
    res.json({
      // Core metrics
      livingCost: metrics.livingCost,
      passiveIncome: metrics.passiveIncome,
      coverageRatio: metrics.coverageRatio,
      runway: metrics.runway,
      freedomScore: metrics.freedomScore,

      // Additional income breakdown
      activeIncome,
      semiPassiveIncome,
      totalIncome: activeIncome + metrics.passiveIncome,

      // Financial data
      liquidAssets: metrics.liquidAssets,
      totalAssets: metrics.totalAssets,
      totalLiabilities: metrics.totalLiabilities,
      netWorth: metrics.totalAssets - metrics.totalLiabilities,
      debtRatio: metrics.debtRatio,
      assetProductivity: metrics.assetProductivity,

      // Score breakdown
      scoreBreakdown: {
        coverageRatioScore: metrics.coverageRatioScore,
        runwayScore: metrics.runwayScore,
        debtRatioScore: metrics.debtRatioScore,
        assetProductivityScore: metrics.assetProductivityScore,
      },

      // Progress indicators
      activeIncomeEngines,
      monthsToFreedom,
      projectedFreedomDate,
      expenseDataPoints: monthlyExpenses.length,

      // Interpretations
      scoreInterpretation,
      coverageInterpretation,

      // Formula details (for transparency)
      formulaWeights: {
        coverageRatio: '40%',
        runway: '30%',
        debtRatio: '20%',
        assetProductivity: '10%',
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * GET /api/dashboard/v2/summary
 * Returns a simplified summary for quick display
 */
router.get('/v2/summary', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';

    // Get full dashboard data
    const dashboardUrl = `http://localhost:${process.env.PORT || 3001}/api/dashboard/v2?user_id=${userId}`;
    const response = await fetch(dashboardUrl);
    const data = await response.json();

    // Return simplified summary
    res.json({
      freedomScore: data.freedomScore,
      coverageRatio: data.coverageRatio,
      runway: data.runway,
      monthsToFreedom: data.monthsToFreedom,
      interpretation: data.scoreInterpretation,
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

export default router;
