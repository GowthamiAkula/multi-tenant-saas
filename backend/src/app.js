const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const tenantRoutes = require('./routes/tenant.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');

const app = express();

// CORS configuration using FRONTEND_URL from env
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Tenant routes
app.use('/api/tenants', tenantRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend is running' });
});

app.use('/api/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/api', taskRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
