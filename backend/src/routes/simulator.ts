import express from 'express';
import pool from '../db/connection';
import { calculateFreedomScore, projectFreedomDate } from '../utils/freedomScore';
import { DEMO_USER_ID } from '../constants';

const router = express.Router();

/**
 * POST /api/simulator/impact
 * Calculate the impact of a financial decision
 */
router.post('/impact', async (req, res) => {
  try {
    const {
      user_id = DEMO_USER_ID,
      additional_income = 0,
      additional_investment = 0,
      investment_roi = 0,
      debt_payoff_amount = 0,
      living_cost_change = 0,
    } = req.body;

    // Fetch current financial state
    const dashboardUrl = `http://localhost:${process.env.PORT || 3001}/api/dashboard?user_id=${user_id}`;
    const response = await fetch(dashboardUrl);
    const currentState = await response.json();

    // Calculate new state with changes
    const newPassiveIncome = currentState.passiveIncome + additional_income;
    const newAssets = currentState.totalAssets + additional_investment;
    const newLiabilities = Math.max(0, currentState.totalLiabilities - debt_payoff_amount);
    const newLivingCost = Math.max(0, currentState.monthlyLivingCost + living_cost_change);
    const newEmergencyFund = currentState.emergencyFund + additional_investment;

    // Calculate new freedom score
    const newScore = calculateFreedomScore({
      passiveIncome: newPassiveIncome,
      monthlyLivingCost: newLivingCost,
      emergencyFund: newEmergencyFund,
      totalAssets: newAssets,
      totalLiabilities: newLiabilities,
      activeIncomeEngines: currentState.activeIncomeEngines,
      targetIncomeEngines: 2,
      previousNetWorth: currentState.netWorth,
    });

    // Project freedom dates
    const currentFreedomDate = projectFreedomDate(
      currentState.passiveIncome,
      currentState.monthlyLivingCost,
      2 // 2% monthly growth
    );

    const newFreedomDate = projectFreedomDate(
      newPassiveIncome,
      newLivingCost,
      investment_roi > 0 ? investment_roi / 12 : 2 // Use provided ROI or default 2%
    );

    // Calculate months accelerated
    let monthsAccelerated = 0;
    if (currentFreedomDate && newFreedomDate) {
      const diffMs = currentFreedomDate.getTime() - newFreedomDate.getTime();
      monthsAccelerated = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30));
    }

    // Calculate impact metrics
    const impact = {
      current: {
        freedomScore: currentState.freedomScore,
        passiveIncome: currentState.passiveIncome,
        netWorth: currentState.netWorth,
        coverageRatio: currentState.coverageRatio,
        freedomDate: currentFreedomDate,
      },
      projected: {
        freedomScore: newScore.totalScore,
        passiveIncome: newPassiveIncome,
        netWorth: newAssets - newLiabilities,
        coverageRatio: newScore.coverageRatio,
        freedomDate: newFreedomDate,
      },
      changes: {
        freedomScoreDelta: newScore.totalScore - currentState.freedomScore,
        passiveIncomeDelta: additional_income,
        netWorthDelta: additional_investment - debt_payoff_amount,
        coverageRatioDelta: newScore.coverageRatio - currentState.coverageRatio,
        monthsAccelerated,
      },
    };

    res.json(impact);
  } catch (error) {
    console.error('Simulator error:', error);
    res.status(500).json({ error: 'Failed to calculate impact' });
  }
});

/**
 * GET /api/simulator/scenarios
 * Get saved scenarios for a user
 */
router.get('/scenarios', async (req, res) => {
  try {
    const userId = req.query.user_id as string || DEMO_USER_ID;

    const result = await pool.query(
      `SELECT * FROM simulation_scenarios
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

/**
 * POST /api/simulator/scenarios
 * Save a simulation scenario
 */
router.post('/scenarios', async (req, res) => {
  try {
    const {
      user_id = DEMO_USER_ID,
      name,
      description = '',
      additional_income = 0,
      additional_investment = 0,
      investment_roi = 0,
      debt_payoff_amount = 0,
      living_cost_change = 0,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Scenario name is required' });
    }

    // Calculate impact
    const impactResponse = await fetch(`http://localhost:${process.env.PORT || 3001}/api/simulator/impact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id,
        additional_income,
        additional_investment,
        investment_roi,
        debt_payoff_amount,
        living_cost_change,
      }),
    });

    const impact = await impactResponse.json();

    // Save scenario
    const result = await pool.query(
      `INSERT INTO simulation_scenarios (
        user_id, name, description, additional_income, additional_investment,
        investment_roi, debt_payoff_amount, living_cost_change,
        current_freedom_date, projected_freedom_date,
        months_accelerated, projected_freedom_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        user_id,
        name,
        description,
        additional_income,
        additional_investment,
        investment_roi,
        debt_payoff_amount,
        living_cost_change,
        impact.current.freedomDate,
        impact.projected.freedomDate,
        impact.changes.monthsAccelerated,
        impact.projected.freedomScore,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving scenario:', error);
    res.status(500).json({ error: 'Failed to save scenario' });
  }
});

/**
 * DELETE /api/simulator/scenarios/:id
 * Delete a scenario
 */
router.delete('/scenarios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM simulation_scenarios WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json({ message: 'Scenario deleted successfully', id });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    res.status(500).json({ error: 'Failed to delete scenario' });
  }
});

export default router;
