import express from 'express';
import pool from '../db/connection';

const router = express.Router();

/**
 * GET /api/expenses
 * Get monthly expenses for a user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';
    const limit = parseInt(req.query.limit as string) || 12; // Default: last 12 months

    const result = await pool.query(
      `SELECT * FROM monthly_expenses
       WHERE user_id = $1
       ORDER BY expense_month DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * GET /api/expenses/last-3-months
 * Get last 3 months expenses for rolling average
 */
router.get('/last-3-months', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';

    const result = await pool.query(
      `SELECT expense_month, total_amount
       FROM monthly_expenses
       WHERE user_id = $1
       ORDER BY expense_month DESC
       LIMIT 3`,
      [userId]
    );

    // Calculate rolling average
    const expenses = result.rows;
    const average = expenses.length > 0
      ? expenses.reduce((sum, exp) => sum + parseFloat(exp.total_amount), 0) / expenses.length
      : 0;

    res.json({
      expenses: expenses.reverse(), // Show oldest to newest
      average: Math.round(average * 100) / 100,
      count: expenses.length,
    });
  } catch (error) {
    console.error('Error fetching last 3 months:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * POST /api/expenses
 * Create or update a monthly expense record
 */
router.post('/', async (req, res) => {
  try {
    const {
      user_id = 'demo-user',
      expense_month, // YYYY-MM-DD format (first day of month)
      total_amount,
      housing = 0,
      food = 0,
      transportation = 0,
      utilities = 0,
      insurance = 0,
      healthcare = 0,
      entertainment = 0,
      other = 0,
      notes = '',
    } = req.body;

    // Validate required fields
    if (!expense_month || total_amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields: expense_month, total_amount' });
    }

    // Ensure expense_month is first day of month
    const date = new Date(expense_month);
    date.setDate(1);
    const formattedMonth = date.toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO monthly_expenses (
        user_id, expense_month, total_amount, housing, food, transportation,
        utilities, insurance, healthcare, entertainment, other, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (user_id, expense_month)
      DO UPDATE SET
        total_amount = EXCLUDED.total_amount,
        housing = EXCLUDED.housing,
        food = EXCLUDED.food,
        transportation = EXCLUDED.transportation,
        utilities = EXCLUDED.utilities,
        insurance = EXCLUDED.insurance,
        healthcare = EXCLUDED.healthcare,
        entertainment = EXCLUDED.entertainment,
        other = EXCLUDED.other,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *`,
      [user_id, formattedMonth, total_amount, housing, food, transportation, utilities, insurance, healthcare, entertainment, other, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving expense:', error);
    res.status(500).json({ error: 'Failed to save expense' });
  }
});

/**
 * PUT /api/expenses/:id
 * Update a monthly expense record
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      total_amount,
      housing,
      food,
      transportation,
      utilities,
      insurance,
      healthcare,
      entertainment,
      other,
      notes,
    } = req.body;

    const result = await pool.query(
      `UPDATE monthly_expenses
       SET total_amount = COALESCE($1, total_amount),
           housing = COALESCE($2, housing),
           food = COALESCE($3, food),
           transportation = COALESCE($4, transportation),
           utilities = COALESCE($5, utilities),
           insurance = COALESCE($6, insurance),
           healthcare = COALESCE($7, healthcare),
           entertainment = COALESCE($8, entertainment),
           other = COALESCE($9, other),
           notes = COALESCE($10, notes),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [total_amount, housing, food, transportation, utilities, insurance, healthcare, entertainment, other, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete a monthly expense record
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM monthly_expenses WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense record not found' });
    }

    res.json({ message: 'Expense deleted successfully', id });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

/**
 * GET /api/expenses/breakdown/:month
 * Get expense breakdown for a specific month
 */
router.get('/breakdown/:month', async (req, res) => {
  try {
    const userId = req.query.user_id as string || 'demo-user';
    const { month } = req.params; // YYYY-MM-DD format

    const result = await pool.query(
      `SELECT * FROM monthly_expenses
       WHERE user_id = $1 AND expense_month = $2`,
      [userId, month]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No expense data for this month' });
    }

    const expense = result.rows[0];

    // Calculate breakdown percentages
    const totalAmount = parseFloat(expense.total_amount);
    const breakdown = {
      housing: {
        amount: parseFloat(expense.housing),
        percentage: (parseFloat(expense.housing) / totalAmount) * 100,
      },
      food: {
        amount: parseFloat(expense.food),
        percentage: (parseFloat(expense.food) / totalAmount) * 100,
      },
      transportation: {
        amount: parseFloat(expense.transportation),
        percentage: (parseFloat(expense.transportation) / totalAmount) * 100,
      },
      utilities: {
        amount: parseFloat(expense.utilities),
        percentage: (parseFloat(expense.utilities) / totalAmount) * 100,
      },
      insurance: {
        amount: parseFloat(expense.insurance),
        percentage: (parseFloat(expense.insurance) / totalAmount) * 100,
      },
      healthcare: {
        amount: parseFloat(expense.healthcare),
        percentage: (parseFloat(expense.healthcare) / totalAmount) * 100,
      },
      entertainment: {
        amount: parseFloat(expense.entertainment),
        percentage: (parseFloat(expense.entertainment) / totalAmount) * 100,
      },
      other: {
        amount: parseFloat(expense.other),
        percentage: (parseFloat(expense.other) / totalAmount) * 100,
      },
    };

    res.json({
      month: expense.expense_month,
      total: totalAmount,
      breakdown,
      notes: expense.notes,
    });
  } catch (error) {
    console.error('Error fetching breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch expense breakdown' });
  }
});

export default router;
