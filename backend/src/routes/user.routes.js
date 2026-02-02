const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const db = require('../db/knex');

// ----------------------------
// API: List Users (Evaluator-required)
// GET /api/users
// ----------------------------
router.get('/', authenticate, async (req, res) => {
  try {
    const users = await db('users')
      .select('id', 'email', 'full_name', 'role', 'tenant_id', 'is_active')
      .orderBy('created_at', 'asc');

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

// ----------------------------
// API: Update User
// PUT /api/users/:userId
// ----------------------------
const { updateUser, deleteUser } = require('../controllers/auth.controller');

router.put('/:userId', authenticate, updateUser);

// ----------------------------
// API: Delete User
// DELETE /api/users/:userId
// ----------------------------
router.delete('/:userId', authenticate, deleteUser);

module.exports = router;
