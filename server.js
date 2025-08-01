require('dotenv').config(); // Load .env variables first

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes'); // ✅ path to auth.js
const adminRoutes = require('./routes/admin'); // ✅ path to admin.js

const app = express(); // ✅ Define app before using it

app.use(cors());
app.use(express.json());

if (user?.role !== 'admin') {
  return <Navigate to="/login" />;
}


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // ✅ Now app is defined above

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
