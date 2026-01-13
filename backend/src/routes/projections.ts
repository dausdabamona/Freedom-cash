import express from 'express';
import pool from '../db/connection';
import { projectFreedomPath, compareScenarios, type ProjectionInput } from '../utils/projectionEngine';

const router = express.Router();

/**
 * POST /api/projections/calculate
 * Calculate projections based on current financial state
 */
router.post('/calculate', async (req, res) => {
  try {
    const userId = req.body.user_id || 'demo-user';

    // Get current financial state
    const dashboardUrl = `http://localhost:${process.env.PORT || 3001}/api/dashboard/v2?user_id=${userId}`;
    const dashboardResponse = await fetch(dashboardUrl);
    const dashboard = await dashboardResponse.json();

    // Get average growth rate from income engines
    const growthResult = await pool.query(
      `SELECT AVG(growth_rate) as avg_growth, COUNT(*) as count
       FROM income_engines
       WHERE user_id = $1 AND is_active = true AND type IN ('passive', 'semi_passive')`,
      [userId]
    );

    const avgAnnualGrowth = parseFloat(growthResult.rows[0]?.avg_growth || '0');
    const incomeEngineCount = parseInt(growthResult.rows[0]?.count || '0');

    // Use provided inputs or defaults
    const input: ProjectionInput = {
      currentPassiveIncome: req.body.currentPassiveIncome ?? dashboard.passiveIncome,
      currentLivingCost: req.body.currentLivingCost ?? dashboard.livingCost,
      currentLiquidAssets: req.body.currentLiquidAssets ?? dashboard.liquidAssets,
      passiveIncomeGrowthRate: req.body.passiveIncomeGrowthRate ?? (avgAnnualGrowth || 8),
      livingCostInflationRate: req.body.livingCostInflationRate ?? 3,
      assetGrowthRate: req.body.assetGrowthRate ?? 6,
      monthlyInvestment: req.body.monthlyInvestment ?? 0,
      monthlyIncomeIncrease: req.body.monthlyIncomeIncrease ?? 0,
    };

    // Calculate projections
    const result = projectFreedomPath(input);

    // Add comparison table
    const comparison = compareScenarios(result);

    res.json({
      ...result,
      comparison,
      dataPoints: incomeEngineCount,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Projection calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate projections' });
  }
});

/**
 * GET /api/projections/quick
 * Quick projection using current state from database
 */
router.get('/quick', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';

    // Get current state
    const dashboardUrl = `http://localhost:${process.env.PORT || 3001}/api/dashboard/v2?user_id=${userId}`;
    const dashboardResponse = await fetch(dashboardUrl);
    const dashboard = await dashboardResponse.json();

    // Get average growth rate
    const growthResult = await pool.query(
      `SELECT AVG(growth_rate) as avg_growth
       FROM income_engines
       WHERE user_id = $1 AND is_active = true AND type IN ('passive', 'semi_passive')`,
      [userId]
    );

    const avgAnnualGrowth = parseFloat(growthResult.rows[0]?.avg_growth || '8');

    // Build input
    const input: ProjectionInput = {
      currentPassiveIncome: dashboard.passiveIncome,
      currentLivingCost: dashboard.livingCost,
      currentLiquidAssets: dashboard.liquidAssets,
      passiveIncomeGrowthRate: avgAnnualGrowth,
      livingCostInflationRate: 3,
      assetGrowthRate: 6,
      monthlyInvestment: 0,
      monthlyIncomeIncrease: 0,
    };

    // Calculate
    const result = projectFreedomPath(input);

    // Return simplified result
    res.json({
      currentCoverageRatio: result.currentState.coverageRatio,
      scenarios: {
        optimistic: {
          freedomDate: result.scenarios.optimistic.freedomDate,
          yearsToFreedom: result.scenarios.optimistic.yearsToFreedom,
          monthsToFreedom: result.scenarios.optimistic.monthsToFreedom,
        },
        realistic: {
          freedomDate: result.scenarios.realistic.freedomDate,
          yearsToFreedom: result.scenarios.realistic.yearsToFreedom,
          monthsToFreedom: result.scenarios.realistic.monthsToFreedom,
        },
        conservative: {
          freedomDate: result.scenarios.conservative.freedomDate,
          yearsToFreedom: result.scenarios.conservative.yearsToFreedom,
          monthsToFreedom: result.scenarios.conservative.monthsToFreedom,
        },
      },
      assumptions: result.assumptions,
    });
  } catch (error) {
    console.error('Quick projection error:', error);
    res.status(500).json({ error: 'Failed to calculate quick projections' });
  }
});

/**
 * GET /api/projections/monthly/:scenario
 * Get monthly breakdown for a specific scenario
 */
router.get('/monthly/:scenario', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';
    const scenario = req.params.scenario; // optimistic, realistic, conservative

    if (!['optimistic', 'realistic', 'conservative'].includes(scenario)) {
      return res.status(400).json({ error: 'Invalid scenario. Must be: optimistic, realistic, or conservative' });
    }

    // Calculate full projections
    const dashboardUrl = `http://localhost:${process.env.PORT || 3001}/api/dashboard/v2?user_id=${userId}`;
    const dashboardResponse = await fetch(dashboardUrl);
    const dashboard = await dashboardResponse.json();

    const growthResult = await pool.query(
      `SELECT AVG(growth_rate) as avg_growth
       FROM income_engines
       WHERE user_id = $1 AND is_active = true AND type IN ('passive', 'semi_passive')`,
      [userId]
    );

    const avgAnnualGrowth = parseFloat(growthResult.rows[0]?.avg_growth || '8');

    const input: ProjectionInput = {
      currentPassiveIncome: dashboard.passiveIncome,
      currentLivingCost: dashboard.livingCost,
      currentLiquidAssets: dashboard.liquidAssets,
      passiveIncomeGrowthRate: avgAnnualGrowth,
      livingCostInflationRate: 3,
      assetGrowthRate: 6,
      monthlyInvestment: 0,
      monthlyIncomeIncrease: 0,
    };

    const result = projectFreedomPath(input);

    // Return the requested scenario
    const selectedScenario = result.scenarios[scenario as keyof typeof result.scenarios];

    res.json({
      scenario: selectedScenario,
      assumptions: result.assumptions[scenario as keyof typeof result.assumptions],
    });
  } catch (error) {
    console.error('Monthly projection error:', error);
    res.status(500).json({ error: 'Failed to get monthly projections' });
  }
});

/**
 * POST /api/projections/compare
 * Compare multiple "what-if" scenarios
 */
router.post('/compare', async (req, res) => {
  try {
    const { scenarios } = req.body;

    if (!Array.isArray(scenarios) || scenarios.length === 0) {
      return res.status(400).json({ error: 'Must provide array of scenarios to compare' });
    }

    const results = scenarios.map((scenario: any) => {
      const input: ProjectionInput = {
        currentPassiveIncome: scenario.currentPassiveIncome,
        currentLivingCost: scenario.currentLivingCost,
        currentLiquidAssets: scenario.currentLiquidAssets,
        passiveIncomeGrowthRate: scenario.passiveIncomeGrowthRate ?? 8,
        livingCostInflationRate: scenario.livingCostInflationRate ?? 3,
        assetGrowthRate: scenario.assetGrowthRate ?? 6,
        monthlyInvestment: scenario.monthlyInvestment ?? 0,
        monthlyIncomeIncrease: scenario.monthlyIncomeIncrease ?? 0,
      };

      const result = projectFreedomPath(input);

      return {
        name: scenario.name || 'Unnamed Scenario',
        description: scenario.description || '',
        realistic: result.scenarios.realistic,
      };
    });

    res.json({
      scenarios: results,
      comparison: results.map(r => ({
        name: r.name,
        freedomDate: r.realistic.freedomDate,
        yearsToFreedom: r.realistic.yearsToFreedom,
        finalPassiveIncome: r.realistic.finalPassiveIncome,
        finalCoverageRatio: r.realistic.finalCoverageRatio,
      })),
    });
  } catch (error) {
    console.error('Compare scenarios error:', error);
    res.status(500).json({ error: 'Failed to compare scenarios' });
  }
});

/**
 * POST /api/projections/milestones
 * Get milestones for reaching freedom
 */
router.post('/milestones', async (req, res) => {
  try {
    const userId = req.body.user_id || 'demo-user';

    // Get current state
    const dashboardUrl = `http://localhost:${process.env.PORT || 3001}/api/dashboard/v2?user_id=${userId}`;
    const dashboardResponse = await fetch(dashboardUrl);
    const dashboard = await dashboardResponse.json();

    const growthResult = await pool.query(
      `SELECT AVG(growth_rate) as avg_growth
       FROM income_engines
       WHERE user_id = $1 AND is_active = true AND type IN ('passive', 'semi_passive')`,
      [userId]
    );

    const avgAnnualGrowth = parseFloat(growthResult.rows[0]?.avg_growth || '8');

    const input: ProjectionInput = {
      currentPassiveIncome: dashboard.passiveIncome,
      currentLivingCost: dashboard.livingCost,
      currentLiquidAssets: dashboard.liquidAssets,
      passiveIncomeGrowthRate: avgAnnualGrowth,
      livingCostInflationRate: 3,
      assetGrowthRate: 6,
      monthlyInvestment: req.body.monthlyInvestment ?? 0,
      monthlyIncomeIncrease: req.body.monthlyIncomeIncrease ?? 0,
    };

    const result = projectFreedomPath(input);

    res.json({
      optimistic: result.scenarios.optimistic.milestones,
      realistic: result.scenarios.realistic.milestones,
      conservative: result.scenarios.conservative.milestones,
    });
  } catch (error) {
    console.error('Milestones error:', error);
    res.status(500).json({ error: 'Failed to calculate milestones' });
  }
});

export default router;
