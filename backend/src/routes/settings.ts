import express from 'express';
import pool from '../db/connection';

const router = express.Router();

/**
 * GET /api/settings
 * Get user's financial profile settings
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';

    const result = await pool.query(
      'SELECT * FROM financial_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default settings if profile doesn't exist
      return res.json({
        monthly_living_cost: 0,
        target_emergency_months: 12,
        target_debt_ratio: 20.00,
        target_income_engines: 2,
        currency: 'IDR',
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * POST /api/settings
 * Create or update user's financial profile settings
 */
router.post('/', async (req, res) => {
  try {
    const {
      user_id = 'demo-user',
      monthly_living_cost,
      target_emergency_months = 12,
      target_debt_ratio = 20.00,
      target_income_engines = 2,
      currency = 'IDR',
    } = req.body;

    if (monthly_living_cost === undefined) {
      return res.status(400).json({ error: 'monthly_living_cost is required' });
    }

    const result = await pool.query(
      `INSERT INTO financial_profiles (user_id, monthly_living_cost, target_emergency_months, target_debt_ratio, target_income_engines, currency)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id)
       DO UPDATE SET
         monthly_living_cost = EXCLUDED.monthly_living_cost,
         target_emergency_months = EXCLUDED.target_emergency_months,
         target_debt_ratio = EXCLUDED.target_debt_ratio,
         target_income_engines = EXCLUDED.target_income_engines,
         currency = EXCLUDED.currency,
         updated_at = NOW()
       RETURNING *`,
      [user_id, monthly_living_cost, target_emergency_months, target_debt_ratio, target_income_engines, currency]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
