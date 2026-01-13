import express from 'express';
import pool from '../db/connection';

const router = express.Router();

/**
 * GET /api/liabilities
 * Get all liabilities for a user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';

    const result = await pool.query(
      `SELECT * FROM liabilities
       WHERE user_id = $1
       ORDER BY remaining_amount DESC, created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching liabilities:', error);
    res.status(500).json({ error: 'Failed to fetch liabilities' });
  }
});

/**
 * GET /api/liabilities/stats
 * Get liability statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';

    const result = await pool.query(
      `SELECT
         type,
         COUNT(*) as count,
         SUM(remaining_amount) as total_remaining,
         SUM(monthly_payment) as total_monthly_payment,
         AVG(interest_rate) as avg_interest_rate
       FROM liabilities
       WHERE user_id = $1 AND is_active = true
       GROUP BY type
       ORDER BY total_remaining DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching liability stats:', error);
    res.status(500).json({ error: 'Failed to fetch liability statistics' });
  }
});

/**
 * POST /api/liabilities
 * Create a new liability
 */
router.post('/', async (req, res) => {
  try {
    const {
      user_id = 'demo-user',
      name,
      type,
      total_amount,
      remaining_amount,
      interest_rate = 0,
      monthly_payment = 0,
      start_date = null,
      end_date = null,
      description = '',
    } = req.body;

    // Validate required fields
    if (!name || !type || total_amount === undefined || remaining_amount === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, total_amount, remaining_amount',
      });
    }

    const validTypes = ['mortgage', 'car_loan', 'student_loan', 'credit_card', 'personal_loan', 'business_loan', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }

    const result = await pool.query(
      `INSERT INTO liabilities (user_id, name, type, total_amount, remaining_amount, interest_rate, monthly_payment, start_date, end_date, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [user_id, name, type, total_amount, remaining_amount, interest_rate, monthly_payment, start_date, end_date, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating liability:', error);
    res.status(500).json({ error: 'Failed to create liability' });
  }
});

/**
 * PUT /api/liabilities/:id
 * Update a liability
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      total_amount,
      remaining_amount,
      interest_rate,
      monthly_payment,
      start_date,
      end_date,
      description,
      is_active,
    } = req.body;

    const result = await pool.query(
      `UPDATE liabilities
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           total_amount = COALESCE($3, total_amount),
           remaining_amount = COALESCE($4, remaining_amount),
           interest_rate = COALESCE($5, interest_rate),
           monthly_payment = COALESCE($6, monthly_payment),
           start_date = COALESCE($7, start_date),
           end_date = COALESCE($8, end_date),
           description = COALESCE($9, description),
           is_active = COALESCE($10, is_active),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [name, type, total_amount, remaining_amount, interest_rate, monthly_payment, start_date, end_date, description, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Liability not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating liability:', error);
    res.status(500).json({ error: 'Failed to update liability' });
  }
});

/**
 * DELETE /api/liabilities/:id
 * Delete a liability
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM liabilities WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Liability not found' });
    }

    res.json({ message: 'Liability deleted successfully', id });
  } catch (error) {
    console.error('Error deleting liability:', error);
    res.status(500).json({ error: 'Failed to delete liability' });
  }
});

export default router;
