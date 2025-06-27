const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/db');

const authRoutes = require('./routes/authRoutes'); // ✅ Add this here

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); // ✅ Mount route before DB connection check

// Test route
app.get('/', (req, res) => {
  res.send('✅ TripeXL Backend Running');
});

// DB Connection + Sync
console.log('✅ sequelize is:', sequelize);

sequelize.authenticate()
  .then(() => {
    console.log('✅ Connected to MySQL database');
    return sequelize.sync();
  })
  .then(() => {
    console.log('✅ All models synced');
  })
  .catch(err => {
    console.error('❌ DB Error:', err);
  });

app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
});
