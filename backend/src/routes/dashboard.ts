import express from 'express';
import pool from '../db/connection';
import { calculateFreedomScore, calculateRunway, projectFreedomDate } from '../utils/freedomScore';

const router = express.Router();

/**
 * GET /api/dashboard
 * Returns the complete Freedom Dashboard metrics for a user
 */
router.get('/', async (req, res) => {
  try {
    // For demo purposes, using a hardcoded user_id
    // In production, extract from JWT token
    const userId = req.query.user_id as string || 'demo-user';

    // Fetch financial profile
    const profileResult = await pool.query(
      'SELECT * FROM financial_profiles WHERE user_id = $1',
      [userId]
    );

    // If no profile exists, return default values
    if (profileResult.rows.length === 0) {
      return res.json({
        monthlyLivingCost: 0,
        activeIncome: 0,
        passiveIncome: 0,
        semiPassiveIncome: 0,
        totalIncome: 0,
        coverageRatio: 0,
        runway: null,
        netWorth: 0,
        freedomScore: 0,
        freedomProgress: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        emergencyFund: 0,
        activeIncomeEngines: 0,
        debtRatio: 0,
        projectedFreedomDate: null,
        scoreBreakdown: {
          coverageRatioScore: 0,
          emergencyFundScore: 0,
          debtScore: 100,
          incomeDiversityScore: 0,
          netWorthGrowthScore: 50,
        }
      });
    }

    const profile = profileResult.rows[0];

    // Fetch income engines
    const incomeResult = await pool.query(
      `SELECT type, SUM(monthly_amount) as total, COUNT(*) as count
       FROM income_engines
       WHERE user_id = $1 AND is_active = true
       GROUP BY type`,
      [userId]
    );

    let activeIncome = 0;
    let passiveIncome = 0;
    let semiPassiveIncome = 0;
    let totalIncomeEngines = 0;

    incomeResult.rows.forEach(row => {
      const amount = parseFloat(row.total);
      const count = parseInt(row.count);
      totalIncomeEngines += count;

      if (row.type === 'active') activeIncome = amount;
      else if (row.type === 'passive') passiveIncome = amount;
      else if (row.type === 'semi_passive') semiPassiveIncome = amount;
    });

    // Fetch assets
    const assetsResult = await pool.query(
      'SELECT SUM(current_value) as total_value, SUM(monthly_yield) as total_yield FROM assets WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    const totalAssets = parseFloat(assetsResult.rows[0]?.total_value || '0');
    const totalAssetYield = parseFloat(assetsResult.rows[0]?.total_yield || '0');

    // Fetch liabilities
    const liabilitiesResult = await pool.query(
      'SELECT SUM(remaining_amount) as total, SUM(monthly_payment) as monthly_payment FROM liabilities WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    const totalLiabilities = parseFloat(liabilitiesResult.rows[0]?.total || '0');
    const monthlyDebtPayment = parseFloat(liabilitiesResult.rows[0]?.monthly_payment || '0');

    // Calculate key metrics
    const netWorth = totalAssets - totalLiabilities;
    const monthlyLivingCost = parseFloat(profile.monthly_living_cost);
    const totalIncome = activeIncome + passiveIncome + semiPassiveIncome;

    // Emergency fund = savings assets
    const emergencyFundResult = await pool.query(
      'SELECT SUM(current_value) as total FROM assets WHERE user_id = $1 AND category = $2 AND is_active = true',
      [userId, 'savings']
    );
    const emergencyFund = parseFloat(emergencyFundResult.rows[0]?.total || '0');

    // Get previous month's net worth for growth calculation
    const previousSnapshotResult = await pool.query(
      `SELECT net_worth FROM freedom_snapshots
       WHERE user_id = $1
       ORDER BY snapshot_date DESC
       LIMIT 1 OFFSET 1`,
      [userId]
    );
    const previousNetWorth = previousSnapshotResult.rows.length > 0
      ? parseFloat(previousSnapshotResult.rows[0].net_worth)
      : undefined;

    // Calculate Freedom Score
    const scoreBreakdown = calculateFreedomScore({
      passiveIncome,
      monthlyLivingCost,
      emergencyFund,
      totalAssets,
      totalLiabilities,
      activeIncomeEngines: totalIncomeEngines,
      targetIncomeEngines: profile.target_income_engines,
      previousNetWorth,
    });

    // Calculate runway
    const runway = calculateRunway(emergencyFund, passiveIncome, monthlyLivingCost);

    // Calculate debt ratio
    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

    // Project freedom date (assuming 2% monthly growth in passive income)
    const projectedFreedomDate = projectFreedomDate(passiveIncome, monthlyLivingCost, 2);

    // Calculate freedom progress (0-100%)
    const freedomProgress = scoreBreakdown.totalScore;

    res.json({
      monthlyLivingCost,
      activeIncome,
      passiveIncome,
      semiPassiveIncome,
      totalIncome,
      coverageRatio: scoreBreakdown.coverageRatio,
      runway,
      netWorth,
      freedomScore: scoreBreakdown.totalScore,
      freedomProgress,
      totalAssets,
      totalLiabilities,
      emergencyFund,
      activeIncomeEngines: totalIncomeEngines,
      debtRatio,
      projectedFreedomDate,
      scoreBreakdown: {
        coverageRatioScore: scoreBreakdown.coverageRatioScore,
        emergencyFundScore: scoreBreakdown.emergencyFundScore,
        debtScore: scoreBreakdown.debtScore,
        incomeDiversityScore: scoreBreakdown.incomeDiversityScore,
        netWorthGrowthScore: scoreBreakdown.netWorthGrowthScore,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * POST /api/dashboard/snapshot
 * Create a snapshot of current financial state
 */
router.post('/snapshot', async (req, res) => {
  try {
    const userId = req.body.user_id || 'demo-user';
    const snapshotDate = req.body.date || new Date().toISOString().split('T')[0];

    // Fetch current dashboard data
    const dashboardResponse = await fetch(`http://localhost:${process.env.PORT || 3001}/api/dashboard?user_id=${userId}`);
    const dashboard = await dashboardResponse.json();

    // Insert snapshot
    const result = await pool.query(
      `INSERT INTO freedom_snapshots (
        user_id, snapshot_date, total_active_income, total_passive_income,
        total_semi_passive_income, total_asset_value, total_asset_yield,
        total_liability_amount, monthly_debt_payment, monthly_living_cost,
        coverage_ratio, net_worth, emergency_fund_months, debt_ratio,
        active_income_engines, freedom_score, runway_months
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (user_id, snapshot_date)
      DO UPDATE SET
        total_active_income = EXCLUDED.total_active_income,
        total_passive_income = EXCLUDED.total_passive_income,
        total_semi_passive_income = EXCLUDED.total_semi_passive_income,
        total_asset_value = EXCLUDED.total_asset_value,
        freedom_score = EXCLUDED.freedom_score
      RETURNING *`,
      [
        userId,
        snapshotDate,
        dashboard.activeIncome,
        dashboard.passiveIncome,
        dashboard.semiPassiveIncome,
        dashboard.totalAssets,
        0, // total_asset_yield
        dashboard.totalLiabilities,
        0, // monthly_debt_payment
        dashboard.monthlyLivingCost,
        dashboard.coverageRatio,
        dashboard.netWorth,
        dashboard.emergencyFund / (dashboard.monthlyLivingCost || 1),
        dashboard.debtRatio,
        dashboard.activeIncomeEngines,
        dashboard.freedomScore,
        dashboard.runway,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Snapshot error:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

export default router;
