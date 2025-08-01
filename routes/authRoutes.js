const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');
const router = express.Router();

const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const JWT_SECRET = process.env.JWT_SECRET;

// 🔐 REGISTER route
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [role]
    );
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    const roleId = roleResult.rows[0].id;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, hashedPassword, roleId]
    );

    const user = result.rows[0];
    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔐 LOGIN route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT users.id, users.name, users.email, users.password, users.role_id, users.status, roles.name AS role
       FROM users
       JOIN roles ON users.role_id = roles.id
       WHERE users.email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Your account is blocked.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🧾 GET all users (admin only)
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT users.id, users.name, users.email, users.status, roles.name AS role
      FROM users
      JOIN roles ON users.role_id = roles.id
      ORDER BY users.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🚫 BLOCK/UNBLOCK user (admin only)
router.patch('/users/:id/status', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'blocked'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: `User ${status}` });
  } catch (err) {
    console.error('Update status error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ❌ DELETE user (admin only)
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
