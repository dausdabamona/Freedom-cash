import express from 'express';
import pool from '../db/connection';

const router = express.Router();

/**
 * GET /api/assets
 * Get all assets for a user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';

    const result = await pool.query(
      `SELECT * FROM assets
       WHERE user_id = $1
       ORDER BY current_value DESC, created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

/**
 * GET /api/assets/stats
 * Get asset statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';

    const result = await pool.query(
      `SELECT
         category,
         COUNT(*) as count,
         SUM(current_value) as total_value,
         SUM(monthly_yield) as total_yield,
         AVG(annual_roi) as avg_roi
       FROM assets
       WHERE user_id = $1 AND is_active = true
       GROUP BY category
       ORDER BY total_value DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching asset stats:', error);
    res.status(500).json({ error: 'Failed to fetch asset statistics' });
  }
});

/**
 * POST /api/assets
 * Create a new asset
 */
router.post('/', async (req, res) => {
  try {
    const {
      user_id = 'demo-user',
      name,
      category,
      current_value,
      monthly_yield = 0,
      annual_roi = 0,
      automation_level = 5,
      description = '',
      purchase_date = null,
    } = req.body;

    // Validate required fields
    if (!name || !category || current_value === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name, category, current_value' });
    }

    const validCategories = ['real_estate', 'stocks', 'bonds', 'crypto', 'business', 'savings', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }

    const result = await pool.query(
      `INSERT INTO assets (user_id, name, category, current_value, monthly_yield, annual_roi, automation_level, description, purchase_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user_id, name, category, current_value, monthly_yield, annual_roi, automation_level, description, purchase_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

/**
 * PUT /api/assets/:id
 * Update an asset
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      current_value,
      monthly_yield,
      annual_roi,
      automation_level,
      description,
      purchase_date,
      is_active,
    } = req.body;

    const result = await pool.query(
      `UPDATE assets
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           current_value = COALESCE($3, current_value),
           monthly_yield = COALESCE($4, monthly_yield),
           annual_roi = COALESCE($5, annual_roi),
           automation_level = COALESCE($6, automation_level),
           description = COALESCE($7, description),
           purchase_date = COALESCE($8, purchase_date),
           is_active = COALESCE($9, is_active),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [name, category, current_value, monthly_yield, annual_roi, automation_level, description, purchase_date, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

/**
 * DELETE /api/assets/:id
 * Delete an asset
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM assets WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ message: 'Asset deleted successfully', id });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

export default router;
