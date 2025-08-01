const express = require('express');
const pool = require('../models/db');
const { verifyToken} = require('../middleware/authMiddleware');
const isAdmin = require('./middleware/isAdmin');
router.get('/admin/users', authenticateToken, isAdmin, getUsers);


const router = express.Router();

// GET all users
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH user status (block/unblock)
router.patch('/users/:id/status', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE user
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
