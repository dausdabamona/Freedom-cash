import express from 'express';
import pool from '../db/connection';

const router = express.Router();

/**
 * GET /api/income-engines
 * Get all income engines for a user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';

    const result = await pool.query(
      `SELECT * FROM income_engines
       WHERE user_id = $1
       ORDER BY monthly_amount DESC, created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching income engines:', error);
    res.status(500).json({ error: 'Failed to fetch income engines' });
  }
});

/**
 * POST /api/income-engines
 * Create a new income engine
 */
router.post('/', async (req, res) => {
  try {
    const {
      user_id = 'demo-user',
      name,
      type,
      monthly_amount,
      growth_rate = 0,
      stability_score = 5,
      description = '',
    } = req.body;

    // Validate required fields
    if (!name || !type || monthly_amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name, type, monthly_amount' });
    }

    // Validate type
    if (!['active', 'semi_passive', 'passive'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be: active, semi_passive, or passive' });
    }

    const result = await pool.query(
      `INSERT INTO income_engines (user_id, name, type, monthly_amount, growth_rate, stability_score, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, name, type, monthly_amount, growth_rate, stability_score, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating income engine:', error);
    res.status(500).json({ error: 'Failed to create income engine' });
  }
});

/**
 * PUT /api/income-engines/:id
 * Update an income engine
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      monthly_amount,
      growth_rate,
      stability_score,
      description,
      is_active,
    } = req.body;

    const result = await pool.query(
      `UPDATE income_engines
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           monthly_amount = COALESCE($3, monthly_amount),
           growth_rate = COALESCE($4, growth_rate),
           stability_score = COALESCE($5, stability_score),
           description = COALESCE($6, description),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, type, monthly_amount, growth_rate, stability_score, description, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Income engine not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating income engine:', error);
    res.status(500).json({ error: 'Failed to update income engine' });
  }
});

/**
 * DELETE /api/income-engines/:id
 * Delete an income engine
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM income_engines WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Income engine not found' });
    }

    res.json({ message: 'Income engine deleted successfully', id });
  } catch (error) {
    console.error('Error deleting income engine:', error);
    res.status(500).json({ error: 'Failed to delete income engine' });
  }
});

export default router;
