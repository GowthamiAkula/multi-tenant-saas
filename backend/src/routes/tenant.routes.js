// backend/src/routes/tenant.routes.js
const express = require('express');
const router = express.Router();

const {
  getTenantDetails,
  updateTenant,
  listTenants,      // API 7
  addUserToTenant,  // API 8
  listTenantUsers   // API 9  ⬅️ ADDED
} = require('../controllers/auth.controller');

const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { addTenantUserSchema } = require('../validation/tenant.schemas');

// API 7: List all tenants (super_admin only)
// GET /api/tenants
router.get('/', authenticate, listTenants);

// API 5: Get tenant details
// GET /api/tenants/:tenantId
router.get('/:tenantId', authenticate, getTenantDetails);

// API 6: Update tenant
// PUT /api/tenants/:tenantId
router.put('/:tenantId', authenticate, updateTenant);

// API 8: Add User to Tenant
// POST /api/tenants/:tenantId/users
router.post(
  '/:tenantId/users',
  authenticate,
  validateBody(addTenantUserSchema),
  addUserToTenant
);

// API 9: List Tenant Users
// GET /api/tenants/:tenantId/users
router.get('/:tenantId/users', authenticate, listTenantUsers);

module.exports = router;
