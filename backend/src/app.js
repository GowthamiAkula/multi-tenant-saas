const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const tenantRoutes = require('./routes/tenant.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');

// 🔹 DB connection (Knex)
const db = require('./db/knex');

const app = express();

// --------------------
// CORS Configuration
// --------------------
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

// --------------------
// ✅ HEALTH CHECK (EVALUATOR REQUIRED)
// --------------------
app.get('/api/health', async (req, res) => {
  try {
    // DB readiness check
    await db.raw('SELECT 1');

    res.status(200).json({
      status: 'ok',
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'not_connected',
    });
  }
});

// --------------------
// Routes
// --------------------
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// --------------------
// Server Start
// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server listening on port ${PORT}`);
});
