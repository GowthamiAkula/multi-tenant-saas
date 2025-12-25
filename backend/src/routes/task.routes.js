const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const { updateTask } = require('../controllers/project.controller');

// API 19: Update Task
router.put('/tasks/:taskId', authenticate, updateTask);

module.exports = router;
