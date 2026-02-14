import express from 'express';
import pool from '../db/connection';
import { calculateAllMetrics, type FreedomInput } from '../utils/freedomFormulas';
import { projectFreedomPath, type ProjectionInput } from '../utils/projectionEngine';
import { DEMO_USER_ID } from '../constants';

const router = express.Router();

/**
 * GET /api/freedom/summary
 * Freedom Dashboard - All key metrics in one endpoint
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.query.user_id as string || DEMO_USER_ID;

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
      `SELECT COALESCE(SUM(remaining_amount), 0) as total
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

/**
 * POST /api/freedom/accelerate
 * Calculate accelerated freedom path with specific actions
 */
router.post('/accelerate', async (req, res) => {
  try {
    const userId = req.body.user_id || DEMO_USER_ID;
    const {
      addPassive = 0,
      reduceCost = 0,
      investCapital = 0,
      investROI = 8,
    } = req.body;

    // 1. Get current state
    const profileResult = await pool.query(
      'SELECT * FROM financial_profiles WHERE user_id = $1',
      [userId]
    );

    const monthlyLivingCost = parseFloat(profileResult.rows[0]?.monthly_living_cost || '0');

    // Get last 3 months expenses
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

    // Get all income sources
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

    // Get all assets
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

    // Get total liabilities
    const liabilitiesResult = await pool.query(
      `SELECT COALESCE(SUM(remaining_amount), 0) as total
       FROM liabilities
       WHERE user_id = $1`,
      [userId]
    );

    const totalLiabilities = parseFloat(liabilitiesResult.rows[0]?.total || '0');

    // Calculate current metrics
    const freedomInput: FreedomInput = {
      monthlyExpenses,
      incomeSources,
      assets,
      totalLiabilities,
    };

    const metrics = calculateAllMetrics(freedomInput);
    const livingCost = metrics.livingCost > 0 ? metrics.livingCost : monthlyLivingCost;
    const passiveIncome = metrics.passiveIncome;

    // Get average growth rate
    const growthResult = await pool.query(
      `SELECT AVG(growth_rate) as avg_growth
       FROM income_engines
       WHERE user_id = $1 AND is_active = true AND type IN ('passive', 'semi_passive')`,
      [userId]
    );

    const avgGrowthRate = parseFloat(growthResult.rows[0]?.avg_growth || '8');

    // 2. Calculate BASELINE projection (current state)
    const baselineInput: ProjectionInput = {
      currentPassiveIncome: passiveIncome,
      currentLivingCost: livingCost,
      currentLiquidAssets: metrics.liquidAssets,
      passiveIncomeGrowthRate: avgGrowthRate,
      livingCostInflationRate: 3,
      assetGrowthRate: 0,
      monthlyInvestment: 0,
      monthlyIncomeIncrease: 0,
    };

    const baselineProjection = projectFreedomPath(baselineInput);
    const baselineRealistic = baselineProjection.scenarios.realistic;

    // 3. Calculate ACCELERATED projection (with changes)
    const monthlyIncomeFromInvestment = (investCapital * (investROI / 100)) / 12;
    const newPassiveIncome = passiveIncome + addPassive + monthlyIncomeFromInvestment;
    const newLivingCost = livingCost - reduceCost;

    const acceleratedInput: ProjectionInput = {
      currentPassiveIncome: newPassiveIncome,
      currentLivingCost: newLivingCost,
      currentLiquidAssets: metrics.liquidAssets,
      passiveIncomeGrowthRate: avgGrowthRate,
      livingCostInflationRate: 3,
      assetGrowthRate: 0,
      monthlyInvestment: 0,
      monthlyIncomeIncrease: 0,
    };

    const acceleratedProjection = projectFreedomPath(acceleratedInput);
    const acceleratedRealistic = acceleratedProjection.scenarios.realistic;

    // 4. Calculate impact
    const monthsAccelerated = baselineRealistic.monthsToFreedom && acceleratedRealistic.monthsToFreedom
      ? baselineRealistic.monthsToFreedom - acceleratedRealistic.monthsToFreedom
      : 0;

    const newCoverageRatio = newLivingCost > 0 ? newPassiveIncome / newLivingCost : 0;
    const coverageImprovement = newCoverageRatio - (passiveIncome / livingCost);

    // 5. Priority Recommendations - Calculate ROI per action
    const actions = [];

    // Action 1: Add Passive Income
    if (addPassive > 0) {
      const incomeOnlyProjection = projectFreedomPath({
        ...baselineInput,
        currentPassiveIncome: passiveIncome + addPassive,
      });
      const incomeMonthsSaved = baselineRealistic.monthsToFreedom && incomeOnlyProjection.scenarios.realistic.monthsToFreedom
        ? baselineRealistic.monthsToFreedom - incomeOnlyProjection.scenarios.realistic.monthsToFreedom
        : 0;
      const incomeEfficiency = addPassive > 0 ? incomeMonthsSaved / (addPassive / 1000000) : 0;

      actions.push({
        action: 'Tambah Passive Income',
        amount: addPassive,
        monthsSaved: incomeMonthsSaved,
        efficiency: incomeEfficiency,
        description: `+${formatRupiah(addPassive)}/bulan → hemat ${incomeMonthsSaved} bulan`,
        priority: 1,
      });
    }

    // Action 2: Reduce Cost
    if (reduceCost > 0) {
      const costOnlyProjection = projectFreedomPath({
        ...baselineInput,
        currentLivingCost: livingCost - reduceCost,
      });
      const costMonthsSaved = baselineRealistic.monthsToFreedom && costOnlyProjection.scenarios.realistic.monthsToFreedom
        ? baselineRealistic.monthsToFreedom - costOnlyProjection.scenarios.realistic.monthsToFreedom
        : 0;
      const costEfficiency = reduceCost > 0 ? costMonthsSaved / (reduceCost / 1000000) : 0;

      actions.push({
        action: 'Kurangi Biaya Hidup',
        amount: reduceCost,
        monthsSaved: costMonthsSaved,
        efficiency: costEfficiency,
        description: `-${formatRupiah(reduceCost)}/bulan → hemat ${costMonthsSaved} bulan`,
        priority: 2,
      });
    }

    // Action 3: Invest Capital
    if (investCapital > 0) {
      const investOnlyProjection = projectFreedomPath({
        ...baselineInput,
        currentPassiveIncome: passiveIncome + monthlyIncomeFromInvestment,
      });
      const investMonthsSaved = baselineRealistic.monthsToFreedom && investOnlyProjection.scenarios.realistic.monthsToFreedom
        ? baselineRealistic.monthsToFreedom - investOnlyProjection.scenarios.realistic.monthsToFreedom
        : 0;
      const investEfficiency = investCapital > 0 ? investMonthsSaved / (investCapital / 10000000) : 0;

      actions.push({
        action: 'Investasi Modal',
        amount: investCapital,
        monthlyYield: monthlyIncomeFromInvestment,
        monthsSaved: investMonthsSaved,
        efficiency: investEfficiency,
        description: `${formatRupiah(investCapital)} @ ${investROI}% → +${formatRupiah(monthlyIncomeFromInvestment)}/bulan → hemat ${investMonthsSaved} bulan`,
        priority: 3,
      });
    }

    // Sort by efficiency (months saved per unit of money)
    actions.sort((a, b) => b.efficiency - a.efficiency);
    actions.forEach((action, index) => {
      action.priority = index + 1;
    });

    // Generate recommendation
    let recommendation = '';
    if (actions.length > 0) {
      const topAction = actions[0];
      recommendation = `Aksi paling efektif: ${topAction.action}. ${topAction.description}. Ini memberikan akselerasi terbesar per Rupiah yang diinvestasikan.`;
    } else {
      recommendation = 'Masukkan perubahan untuk melihat rekomendasi.';
    }

    // 6. Build response
    res.json({
      baseline: {
        passiveIncome: Math.round(passiveIncome * 100) / 100,
        livingCost: Math.round(livingCost * 100) / 100,
        coverageRatio: Math.round((passiveIncome / livingCost) * 10000) / 10000,
        freedomDate: baselineRealistic.freedomDate,
        monthsToFreedom: baselineRealistic.monthsToFreedom,
        yearsToFreedom: baselineRealistic.yearsToFreedom,
      },
      accelerated: {
        passiveIncome: Math.round(newPassiveIncome * 100) / 100,
        livingCost: Math.round(newLivingCost * 100) / 100,
        coverageRatio: Math.round(newCoverageRatio * 10000) / 10000,
        freedomDate: acceleratedRealistic.freedomDate,
        monthsToFreedom: acceleratedRealistic.monthsToFreedom,
        yearsToFreedom: acceleratedRealistic.yearsToFreedom,
      },
      impact: {
        monthsAccelerated: Math.round(monthsAccelerated),
        yearsAccelerated: Math.round(monthsAccelerated / 12 * 10) / 10,
        coverageImprovement: Math.round(coverageImprovement * 10000) / 10000,
        incomeIncrease: Math.round((addPassive + monthlyIncomeFromInvestment) * 100) / 100,
        expenseDecrease: Math.round(reduceCost * 100) / 100,
      },
      actions: actions,
      recommendation: recommendation,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Accelerate calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate acceleration' });
  }
});

/**
 * GET /api/freedom/lite
 * Ultra-fast lite dashboard - pre-calculated, minimal data
 * Optimized for low-end devices and daily quick checks
 */
router.get('/lite', async (req, res) => {
  try {
    const userId = req.query.user_id as string || DEMO_USER_ID;

    // Get financial profile
    const profileResult = await pool.query(
      'SELECT * FROM financial_profiles WHERE user_id = $1',
      [userId]
    );

    const monthlyLivingCost = parseFloat(profileResult.rows[0]?.monthly_living_cost || '0');

    // Get last 3 months expenses
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

    // Get income sources
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

    // Get assets
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

    // Get liabilities
    const liabilitiesResult = await pool.query(
      `SELECT COALESCE(SUM(remaining_amount), 0) as total
       FROM liabilities
       WHERE user_id = $1`,
      [userId]
    );

    const totalLiabilities = parseFloat(liabilitiesResult.rows[0]?.total || '0');

    // Calculate metrics
    const freedomInput: FreedomInput = {
      monthlyExpenses,
      incomeSources,
      assets,
      totalLiabilities,
    };

    const metrics = calculateAllMetrics(freedomInput);
    const livingCost = metrics.livingCost > 0 ? metrics.livingCost : monthlyLivingCost;
    const passiveIncome = metrics.passiveIncome;
    const coverageRatio = livingCost > 0 ? passiveIncome / livingCost : 0;

    // Get growth rate
    const growthResult = await pool.query(
      `SELECT AVG(growth_rate) as avg_growth
       FROM income_engines
       WHERE user_id = $1 AND is_active = true AND type IN ('passive', 'semi_passive')`,
      [userId]
    );

    const avgGrowthRate = parseFloat(growthResult.rows[0]?.avg_growth || '8');

    // Calculate projection (realistic only)
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
    const realistic = projection.scenarios.realistic;

    // Determine fastest action
    let fastestAction = '';
    const gap = Math.max(0, livingCost - passiveIncome);

    if (coverageRatio >= 1.0) {
      fastestAction = 'Sudah bebas! Fokus maintain & tingkatkan kualitas hidup';
    } else if (gap > 0) {
      const gapRupiah = formatRupiah(gap);

      if (passiveIncome < livingCost * 0.5) {
        fastestAction = `Tambah passive income +${gapRupiah}/bulan untuk capai 100%`;
      } else if (passiveIncome < livingCost * 0.8) {
        if (livingCost > 5000000) {
          fastestAction = `Kurangi biaya hidup Rp1-2 juta ATAU tambah passive income ${gapRupiah}`;
        } else {
          fastestAction = `Tambah passive income ${gapRupiah}/bulan - hampir bebas!`;
        }
      } else {
        fastestAction = `Final push! Tinggal ${gapRupiah}/bulan lagi. Fokus scaling passive income!`;
      }
    } else {
      fastestAction = 'Pertahankan passive income ≥ biaya hidup';
    }

    // Determine status
    let status: 'free' | 'approaching' | 'building';
    if (coverageRatio >= 1.0) {
      status = 'free';
    } else if (coverageRatio >= 0.5) {
      status = 'approaching';
    } else {
      status = 'building';
    }

    // Return minimal, pre-calculated data
    res.json({
      freedomDate: realistic.freedomDate,
      monthsToFreedom: realistic.monthsToFreedom,
      coverageRatio: Math.round(coverageRatio * 10000) / 10000,
      passiveIncome: Math.round(passiveIncome * 100) / 100,
      livingCost: Math.round(livingCost * 100) / 100,
      fastestAction: fastestAction,
      status: status,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Lite dashboard error:', error);
    res.status(500).json({ error: 'Failed to load lite dashboard' });
  }
});

// Helper function to format Rupiah
function formatRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp${(amount / 1_000_000_000).toFixed(1)}M`;
  } else if (amount >= 1_000_000) {
    return `Rp${(amount / 1_000_000).toFixed(1)}Jt`;
  } else if (amount >= 1_000) {
    return `Rp${(amount / 1_000).toFixed(0)}Rb`;
  } else {
    return `Rp${amount.toFixed(0)}`;
  }
}

export default router;
