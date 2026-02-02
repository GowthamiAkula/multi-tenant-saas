const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const db = require('../db/knex');

const {
  createProject,
  updateProject,
  deleteProject,
  createTask,
  listTasks,
  updateTaskStatus,
  updateTask,
  getProjectById,
  deleteTask
} = require('../controllers/project.controller');

// ----------------------------
// API: List Projects (FINAL FIX)
// GET /api/projects
// ----------------------------
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, tenantId } = req.user;

    let projects;

    // ✅ Super admin → ALL projects
    if (role === 'super_admin') {
      projects = await db('projects')
        .select(
          'id',
          'name',
          'description',
          'status',
          'tenant_id',
          'created_by'
        )
        .orderBy('created_at', 'desc');
    } 
    // ✅ Tenant-based users
    else {
      projects = await db('projects')
        .select(
          'id',
          'name',
          'description',
          'status',
          'tenant_id',
          'created_by'
        )
        .where('tenant_id', tenantId)
        .orderBy('created_at', 'desc');
    }

    return res.status(200).json({
      success: true,
      data: {
        projects,
        total: projects.length,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          limit: 20,
        },
      },
    });
  } catch (error) {
    console.error('Error listing projects:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
    });
  }
});

// ----------------------------
// Get single project
// ----------------------------
router.get('/:projectId', authenticate, getProjectById);

// ----------------------------
// Create Project
// ----------------------------
router.post('/', authenticate, createProject);

// ----------------------------
// Update Project
// ----------------------------
router.put('/:projectId', authenticate, updateProject);

// ----------------------------
// Delete Project
// ----------------------------
router.delete('/:projectId', authenticate, deleteProject);

// ----------------------------
// Create Task
// ----------------------------
router.post('/:projectId/tasks', authenticate, createTask);

// ----------------------------
// List Project Tasks
// ----------------------------
router.get('/:projectId/tasks', authenticate, listTasks);

// ----------------------------
// Update Task Status
// ----------------------------
router.patch('/:projectId/tasks/:taskId/status', authenticate, updateTaskStatus);

// ----------------------------
// Delete Task
// ----------------------------
router.delete('/:projectId/tasks/:taskId', authenticate, deleteTask);

module.exports = router;
