const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const { updateUser, deleteUser } = require('../controllers/auth.controller');

// API 10: Update User
router.put('/:userId', authenticate, updateUser);

// API 11: Delete User
router.delete('/:userId', authenticate, deleteUser);

module.exports = router;
