const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');

const {
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  createTask,
  listTasks,
  updateTaskStatus,
  updateTask,
  getProjectById,
  deleteTask
} = require('../controllers/project.controller');

// List Projects
router.get('/', authenticate, listProjects);

// Get single project
router.get('/:projectId', authenticate, getProjectById);

// Create Project
router.post('/', authenticate, createProject);

// Update Project
router.put('/:projectId', authenticate, updateProject);

// Delete Project
router.delete('/:projectId', authenticate, deleteProject);

// Create Task
router.post('/:projectId/tasks', authenticate, createTask);

// List Project Tasks
router.get('/:projectId/tasks', authenticate, listTasks);

// Update Task Status
router.patch('/:projectId/tasks/:taskId/status', authenticate, updateTaskStatus);

// Delete Task
router.delete('/:projectId/tasks/:taskId', authenticate, deleteTask);

module.exports = router;
