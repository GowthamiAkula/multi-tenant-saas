const express = require('express');
const router = express.Router();

console.log('auth.routes.js loaded');

const authController = require('../controllers/auth.controller');
const { validateBody } = require('../middleware/validate');
const {
  registerTenantSchema,
  loginSchema,
} = require('../validation/auth.schemas');
const { authenticate } = require('../middleware/auth');

// API 1: Tenant registration
router.post(
  '/register-tenant',
  validateBody(registerTenantSchema),
  authController.registerTenant
);

// API 2: User login
router.post('/login', validateBody(loginSchema), authController.login);

// API 3: Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// API 4: Logout
router.post('/logout', authController.logout);

// TEMP DEBUG ROUTE: reset super admin password to Admin@123
// Call once: POST /api/auth/debug/reset-super-admin
router.post(
  '/debug/reset-super-admin',
  authController.resetSuperAdminPassword
);
router.post('/debug/create-demo-admin', authController.createDemoAdmin);


module.exports = router;
