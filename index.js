require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./models/db');

const app = express(); // ✅ Make sure this is defined before routes

app.use(cors());
app.use(express.json());

// 🔹 Test DB connection route
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Test DB error:', err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// 🔹 Import your routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
