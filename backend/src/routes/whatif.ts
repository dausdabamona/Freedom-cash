import express from 'express';
import pool from '../db/connection';
import { calculateWhatIf, generateRiskReport, type WhatIfInput } from '../utils/whatIfCalculator';

const router = express.Router();

/**
 * POST /api/whatif/calculate
 * Calculate a what-if scenario
 */
router.post('/calculate', async (req, res) => {
  try {
    const userId = req.body.user_id || 'demo-user';

    // Get current financial state if not provided
    let currentState = req.body.currentState;

    if (!currentState) {
      // Fetch from database
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

      const avgGrowthRate = parseFloat(growthResult.rows[0]?.avg_growth || '8');

      currentState = {
        currentPassiveIncome: dashboard.passiveIncome,
        currentLivingCost: dashboard.livingCost,
        currentLiquidAssets: dashboard.liquidAssets,
        currentGrowthRate: avgGrowthRate,
      };
    }

    // Build what-if input
    const input: WhatIfInput = {
      ...currentState,
      additionalIncome: req.body.additionalIncome || 0,
      investmentAmount: req.body.investmentAmount || 0,
      investmentROI: req.body.investmentROI || 0,
      expenseReduction: req.body.expenseReduction || 0,
      expenseReductionPercent: req.body.expenseReductionPercent || 0,
    };

    // Calculate
    const result = calculateWhatIf(input);

    // Generate risk report
    const riskReport = generateRiskReport(result.risk);

    res.json({
      ...result,
      riskReport,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('What-if calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate what-if scenario' });
  }
});

/**
 * POST /api/whatif/quick
 * Quick what-if calculation with common scenarios
 */
router.post('/quick', async (req, res) => {
  try {
    const userId = req.body.user_id || 'demo-user';
    const scenarioType = req.body.scenario; // 'income', 'investment', 'expense'

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

    const avgGrowthRate = parseFloat(growthResult.rows[0]?.avg_growth || '8');

    const currentState = {
      currentPassiveIncome: dashboard.passiveIncome,
      currentLivingCost: dashboard.livingCost,
      currentLiquidAssets: dashboard.liquidAssets,
      currentGrowthRate: avgGrowthRate,
    };

    // Define quick scenarios
    const scenarios: { [key: string]: Partial<WhatIfInput> } = {
      income_500: {
        additionalIncome: 500,
        investmentAmount: 0,
        expenseReduction: 0,
      },
      income_1000: {
        additionalIncome: 1000,
        investmentAmount: 0,
        expenseReduction: 0,
      },
      invest_10k: {
        additionalIncome: 0,
        investmentAmount: 10000,
        investmentROI: 8,
        expenseReduction: 0,
      },
      invest_50k: {
        additionalIncome: 0,
        investmentAmount: 50000,
        investmentROI: 8,
        expenseReduction: 0,
      },
      expense_10pct: {
        additionalIncome: 0,
        investmentAmount: 0,
        expenseReductionPercent: 10,
      },
      expense_20pct: {
        additionalIncome: 0,
        investmentAmount: 0,
        expenseReductionPercent: 20,
      },
      combined: {
        additionalIncome: 500,
        investmentAmount: 10000,
        investmentROI: 8,
        expenseReductionPercent: 10,
      },
    };

    // Calculate requested scenario or all
    if (scenarioType && scenarios[scenarioType]) {
      const input: WhatIfInput = {
        ...currentState,
        ...scenarios[scenarioType],
      };
      const result = calculateWhatIf(input);
      res.json({ [scenarioType]: result });
    } else {
      // Calculate all scenarios
      const results: { [key: string]: any } = {};

      for (const [key, scenario] of Object.entries(scenarios)) {
        const input: WhatIfInput = {
          ...currentState,
          ...scenario,
        };
        results[key] = calculateWhatIf(input);
      }

      res.json({
        scenarios: results,
        current: currentState,
      });
    }
  } catch (error) {
    console.error('Quick what-if error:', error);
    res.status(500).json({ error: 'Failed to calculate quick scenarios' });
  }
});

/**
 * POST /api/whatif/compare
 * Compare multiple what-if scenarios side by side
 */
router.post('/compare', async (req, res) => {
  try {
    const userId = req.body.user_id || 'demo-user';
    const scenarios = req.body.scenarios || [];

    if (!Array.isArray(scenarios) || scenarios.length === 0) {
      return res.status(400).json({ error: 'Must provide array of scenarios' });
    }

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

    const avgGrowthRate = parseFloat(growthResult.rows[0]?.avg_growth || '8');

    const currentState = {
      currentPassiveIncome: dashboard.passiveIncome,
      currentLivingCost: dashboard.livingCost,
      currentLiquidAssets: dashboard.liquidAssets,
      currentGrowthRate: avgGrowthRate,
    };

    // Calculate each scenario
    const results = scenarios.map((scenario: any) => {
      const input: WhatIfInput = {
        ...currentState,
        additionalIncome: scenario.additionalIncome || 0,
        investmentAmount: scenario.investmentAmount || 0,
        investmentROI: scenario.investmentROI || 0,
        expenseReduction: scenario.expenseReduction || 0,
        expenseReductionPercent: scenario.expenseReductionPercent || 0,
      };

      const result = calculateWhatIf(input);

      return {
        name: scenario.name || 'Unnamed Scenario',
        description: scenario.description || '',
        result,
      };
    });

    // Create comparison table
    const comparison = results.map(r => ({
      name: r.name,
      freedomDate: r.result.projected.freedomDate,
      monthsAccelerated: r.result.impact.monthsAccelerated,
      yearsAccelerated: r.result.impact.yearsAccelerated,
      riskScore: r.result.risk.overall,
      riskCategory: r.result.risk.category,
      coverageImprovement: r.result.impact.coverageRatioImprovement,
    }));

    // Sort by months accelerated (best to worst)
    comparison.sort((a, b) => b.monthsAccelerated - a.monthsAccelerated);

    res.json({
      current: currentState,
      scenarios: results,
      comparison,
      bestScenario: comparison[0]?.name || null,
    });
  } catch (error) {
    console.error('Compare scenarios error:', error);
    res.status(500).json({ error: 'Failed to compare scenarios' });
  }
});

/**
 * POST /api/whatif/optimize
 * Find optimal combination of changes within constraints
 */
router.post('/optimize', async (req, res) => {
  try {
    const userId = req.body.user_id || 'demo-user';
    const constraints = {
      maxIncomeIncrease: req.body.maxIncomeIncrease || 1000,
      maxInvestment: req.body.maxInvestment || 50000,
      maxExpenseReduction: req.body.maxExpenseReduction || 30, // percentage
    };

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

    const avgGrowthRate = parseFloat(growthResult.rows[0]?.avg_growth || '8');

    const currentState = {
      currentPassiveIncome: dashboard.passiveIncome,
      currentLivingCost: dashboard.livingCost,
      currentLiquidAssets: dashboard.liquidAssets,
      currentGrowthRate: avgGrowthRate,
    };

    // Generate different combinations
    const scenarios = [
      {
        name: 'Focus on Income',
        additionalIncome: constraints.maxIncomeIncrease,
        investmentAmount: 0,
        expenseReductionPercent: 0,
      },
      {
        name: 'Focus on Investment',
        additionalIncome: 0,
        investmentAmount: constraints.maxInvestment,
        investmentROI: 8,
        expenseReductionPercent: 0,
      },
      {
        name: 'Focus on Expenses',
        additionalIncome: 0,
        investmentAmount: 0,
        expenseReductionPercent: constraints.maxExpenseReduction,
      },
      {
        name: 'Balanced Approach',
        additionalIncome: constraints.maxIncomeIncrease * 0.5,
        investmentAmount: constraints.maxInvestment * 0.5,
        investmentROI: 8,
        expenseReductionPercent: constraints.maxExpenseReduction * 0.5,
      },
      {
        name: 'Income + Expenses',
        additionalIncome: constraints.maxIncomeIncrease * 0.7,
        investmentAmount: 0,
        expenseReductionPercent: constraints.maxExpenseReduction * 0.7,
      },
      {
        name: 'All Levers',
        additionalIncome: constraints.maxIncomeIncrease,
        investmentAmount: constraints.maxInvestment,
        investmentROI: 8,
        expenseReductionPercent: constraints.maxExpenseReduction,
      },
    ];

    // Calculate each
    const results = scenarios.map(scenario => {
      const input: WhatIfInput = {
        ...currentState,
        ...scenario,
      };
      const result = calculateWhatIf(input);

      // Calculate efficiency score (acceleration vs risk)
      const efficiencyScore = result.impact.monthsAccelerated * (result.risk.overall / 100);

      return {
        ...scenario,
        result,
        efficiencyScore,
      };
    });

    // Find optimal (best acceleration with acceptable risk)
    const safeResults = results.filter(r => r.result.risk.overall >= 50); // Medium risk or better
    const optimal = safeResults.sort((a, b) => b.efficiencyScore - a.efficiencyScore)[0];

    res.json({
      current: currentState,
      constraints,
      scenarios: results,
      optimal: optimal ? {
        name: optimal.name,
        monthsAccelerated: optimal.result.impact.monthsAccelerated,
        riskScore: optimal.result.risk.overall,
        efficiencyScore: optimal.efficiencyScore,
        details: optimal.result,
      } : null,
    });
  } catch (error) {
    console.error('Optimize error:', error);
    res.status(500).json({ error: 'Failed to optimize scenario' });
  }
});

export default router;
