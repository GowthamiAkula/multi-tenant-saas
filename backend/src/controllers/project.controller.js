const db = require('../db/knex');

// API 12: Create Project
exports.createProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const { userId, tenantId } = req.user; // from JWT

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // 1) Get tenant to know maxProjects
    const tenant = await db('tenants').where({ id: tenantId }).first();
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const maxProjects = tenant.max_projects;

    // 2) Count current projects for this tenant
    const [{ count: totalProjectsRaw }] = await db('projects')
      .where({ tenant_id: tenantId })
      .count();
    const currentProjects = Number(totalProjectsRaw || 0);

    if (maxProjects && currentProjects >= maxProjects) {
      return res.status(403).json({
        success: false,
        message: 'Project limit reached'
      });
    }

    // 3) Insert new project
    const [project] = await db('projects')
      .insert({
        tenant_id: tenantId,
        name,
        description: description || null,
        status: status || 'active',
        created_by: userId
      })
      .returning([
        'id',
        'tenant_id',
        'name',
        'description',
        'status',
        'created_by',
        'created_at'
      ]);

    // 4) Log in audit_logs
    await db('audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      action: 'PROJECT_CREATED'
    });

    return res.status(201).json({
      success: true,
      data: {
        id: project.id,
        tenantId: project.tenant_id,
        name: project.name,
        description: project.description,
        status: project.status,
        createdBy: project.created_by,
        createdAt: project.created_at
      }
    });
  } catch (err) {
    console.error('Error in createProject:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
// API 13: List Projects
exports.listProjects = async (req, res) => {
  try {
    const { tenantId } = req.user; // from JWT

    let {
      status,
      search,
      page = 1,
      limit = 20
    } = req.query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 20;
    if (limit > 100) limit = 100;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // 1) Base query filtered by tenant
    let baseQuery = db('projects as p')
      .leftJoin('users as u', 'p.created_by', 'u.id')
      .where('p.tenant_id', tenantId)
      .select(
        'p.id',
        'p.name',
        'p.description',
        'p.status',
        'p.created_at',
        'u.id as creator_id',
        'u.full_name as creator_name'
      );

    // 2) Optional status filter
    if (status) {
      baseQuery = baseQuery.andWhere('p.status', status);
    }

    // 3) Optional search by name (case-insensitive)
    if (search) {
      const like = `%${search}%`;
      baseQuery = baseQuery.andWhereILike('p.name', like);
    }

    // 4) Count total with same filters
    let countQuery = db('projects as p')
      .where('p.tenant_id', tenantId);

    if (status) countQuery = countQuery.andWhere('p.status', status);
    if (search) {
      const like = `%${search}%`;
      countQuery = countQuery.andWhereILike('p.name', like);
    }

    const [{ count: totalRaw }] = await countQuery.count();
    const total = Number(totalRaw || 0);

    // 5) Get projects page
    const projects = await baseQuery
      .orderBy('p.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const projectIds = projects.map((p) => p.id);

    // 6) Task counts (total and completed) per project
    let taskCounts = [];
    let completedCounts = [];

    if (projectIds.length > 0) {
      taskCounts = await db('tasks')
        .select('project_id')
        .count('* as taskCount')
        .whereIn('project_id', projectIds)
        .groupBy('project_id');

      completedCounts = await db('tasks')
        .select('project_id')
        .count('* as completedTaskCount')
        .whereIn('project_id', projectIds)
        .andWhere('status', 'completed')
        .groupBy('project_id');
    }

    const taskCountMap = {};
    taskCounts.forEach((row) => {
      taskCountMap[row.project_id] = Number(row.taskCount);
    });

    const completedCountMap = {};
    completedCounts.forEach((row) => {
      completedCountMap[row.project_id] = Number(row.completedTaskCount);
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      data: {
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          createdBy: {
            id: p.creator_id,
            fullName: p.creator_name
          },
          taskCount: taskCountMap[p.id] || 0,
          completedTaskCount: completedCountMap[p.id] || 0,
          createdAt: p.created_at
        })),
        total,
        pagination: {
          currentPage: page,
          totalPages,
          limit
        }
      }
    });
  } catch (err) {
    console.error('Error in listProjects:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
exports.getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tenantId } = req.user;

    // 1) Load project for this tenant
    const project = await db('projects as p')
      .leftJoin('users as u', 'p.created_by', 'u.id')
      .where('p.id', projectId)
      .andWhere('p.tenant_id', tenantId)
      .select(
        'p.id',
        'p.name',
        'p.description',
        'p.status',
        'p.created_at',
        'u.id as creator_id',
        'u.full_name as creator_name'
      )
      .first();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    return res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          createdBy: {
            id: project.creator_id,
            fullName: project.creator_name
          },
          createdAt: project.created_at
        }
      }
    });
  } catch (err) {
    console.error('Error in getProjectById:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// API 14: Update Project
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const { userId, tenantId, role } = req.user;

    // 1) Load project and verify tenant
    const project = await db('projects')
      .where({ id: projectId })
      .first();

    if (!project || project.tenant_id !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const isTenantAdmin = role === 'tenant_admin';
    const isCreator = project.created_by === userId;

    // 2) Only tenant_admin or creator can update
    if (!isTenantAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }

    // 3) Build partial update
    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (status !== undefined) {
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided to update'
      });
    }

    // 4) Perform update
    const [updated] = await db('projects')
      .where({ id: projectId })
      .update(updateData)
      .returning(['id', 'name', 'description', 'status', 'updated_at']);

    // 5) Log in audit_logs
    await db('audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      action: 'PROJECT_UPDATED'
    });

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        status: updated.status,
        updatedAt: updated.updated_at
      }
    });
  } catch (err) {
    console.error('Error in updateProject:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
// API 15: Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, tenantId, role } = req.user;

    // 1) Load project and verify tenant
    const project = await db('projects')
      .where({ id: projectId })
      .first();

    if (!project || project.tenant_id !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const isTenantAdmin = role === 'tenant_admin';
    const isCreator = project.created_by === userId;

    // 2) Only tenant_admin or creator can delete
    if (!isTenantAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project'
      });
    }

    // 3) Handle related tasks (cascade/cleanup)
    await db('tasks')
      .where({ project_id: projectId })
      .del();

    // 4) Delete project
    await db('projects')
      .where({ id: projectId })
      .del();

    // 5) Log audit
    await db('audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      action: 'PROJECT_DELETED'
    });

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteProject:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
// API 16: Create Task
exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const { userId, tenantId } = req.user;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    // 1) Verify project exists and belongs to user's tenant
    const project = await db('projects')
      .where({ id: projectId })
      .first();

    if (!project || project.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Project doesn't belong to user's tenant"
      });
    }

    // 2) If assignedTo provided, verify user belongs to same tenant
    let assigneeId = null;

    if (assignedTo) {
      const assignee = await db('users')
        .where({ id: assignedTo, tenant_id: tenantId })
        .first();

      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: "assignedTo user doesn't belong to same tenant"
        });
      }

      assigneeId = assignedTo;
    }

    // 3) Insert task
    const [task] = await db('tasks')
  .insert({
    project_id: projectId,
    tenant_id: tenantId,
    title,
    description: description || null,
    status: 'todo',
    priority: priority || 'medium',
    assigned_to: assigneeId,
    due_date: dueDate || null
  })
  .returning([
    'id',
    'project_id',
    'tenant_id',
    'title',
    'description',
    'status',
    'priority',
    'assigned_to',
    'due_date',
    'created_at'
  ]);



    // 4) Log audit
    await db('audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      action: 'TASK_CREATED'
    });

    return res.status(201).json({
      success: true,
      data: {
        id: task.id,
        projectId: task.project_id,
        tenantId: task.tenant_id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assigned_to,
        dueDate: task.due_date,
        createdAt: task.created_at
      }
    });
  } catch (err) {
    console.error('Error in createTask:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
// API 17: List Project Tasks
exports.listTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tenantId } = req.user;

    let {
      status,
      assignedTo,
      priority,
      search,
      page = 1,
      limit = 50
    } = req.query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 50;
    if (limit > 100) limit = 100;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // 1) Verify project belongs to user's tenant
    const project = await db('projects')
      .where({ id: projectId })
      .first();

    if (!project || project.tenant_id !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // 2) Base query: tasks for this project
    let baseQuery = db('tasks as t')
      .leftJoin('users as u', 't.assigned_to', 'u.id')
      .where('t.project_id', projectId)
      .select(
        't.id',
        't.title',
        't.description',
        't.status',
        't.priority',
        't.due_date',
        't.created_at',
        'u.id as assignee_id',
        'u.full_name as assignee_name',
        'u.email as assignee_email'
      );

    // 3) Apply filters
    if (status) {
      baseQuery = baseQuery.andWhere('t.status', status);
    }

    if (assignedTo) {
      baseQuery = baseQuery.andWhere('t.assigned_to', assignedTo);
    }

    if (priority) {
      baseQuery = baseQuery.andWhere('t.priority', priority);
    }

    if (search) {
      const like = `%${search}%`;
      baseQuery = baseQuery.andWhereILike('t.title', like);
    }

    // Count query with same filters
    let countQuery = db('tasks as t')
      .where('t.project_id', projectId);

    if (status) countQuery = countQuery.andWhere('t.status', status);
    if (assignedTo) countQuery = countQuery.andWhere('t.assigned_to', assignedTo);
    if (priority) countQuery = countQuery.andWhere('t.priority', priority);
    if (search) {
      const like = `%${search}%`;
      countQuery = countQuery.andWhereILike('t.title', like);
    }

    const [{ count: totalRaw }] = await countQuery.count();
    const total = Number(totalRaw || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    // 4) Fetch page ordered by priority DESC, then dueDate ASC
    const tasks = await baseQuery
      .orderBy([
        { column: 't.priority', order: 'desc' },
        { column: 't.due_date', order: 'asc' }
      ])
      .limit(limit)
      .offset(offset);

    return res.status(200).json({
      success: true,
      data: {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assignedTo: t.assignee_id
            ? {
                id: t.assignee_id,
                fullName: t.assignee_name,
                email: t.assignee_email
              }
            : null,
          dueDate: t.due_date,
          createdAt: t.created_at
        })),
        total,
        pagination: {
          currentPage: page,
          totalPages,
          limit
        }
      }
    });
  } catch (err) {
    console.error('Error in listTasks:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// API 18: Update Task Status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { tenantId } = req.user;
    const { status } = req.body;

    const allowedStatuses = ['todo', 'in_progress', 'completed'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed: todo, in_progress, completed'
      });
    }

    // 1) Verify task belongs to user's tenant
    const task = await db('tasks')
      .where({ id: taskId })
      .first();

    if (!task || task.tenant_id !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // 2) Update only status
    const [updated] = await db('tasks')
      .where({ id: taskId })
      .update({ status })
      .returning(['id', 'status', 'updated_at']);

    return res.status(200).json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updated_at
      }
    });
  } catch (err) {
    console.error('Error in updateTaskStatus:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
// API 19: Update Task (full/partial)
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { tenantId } = req.user;
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate
    } = req.body;

    const allowedStatuses = ['todo', 'in_progress', 'completed'];
    const allowedPriorities = ['low', 'medium', 'high'];

    // 1) Load task and verify tenant
    const task = await db('tasks')
      .where({ id: taskId })
      .first();

    if (!task || task.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Task doesn't belong to user's tenant"
      });
    }

    // 2) Build partial update object
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Allowed: todo, in_progress, completed'
        });
      }
      updateData.status = status;
    }

    if (priority !== undefined) {
      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid priority. Allowed: low, medium, high'
        });
      }
      updateData.priority = priority;
    }

    // assignedTo: verify same tenant, allow null to unassign
    if (assignedTo !== undefined) {
      if (assignedTo === null) {
        updateData.assigned_to = null;
      } else {
        const assignee = await db('users')
          .where({ id: assignedTo, tenant_id: tenantId })
          .first();

        if (!assignee) {
          return res.status(400).json({
            success: false,
            message: "assignedTo user doesn't belong to same tenant"
          });
        }

        updateData.assigned_to = assignedTo;
      }
    }

    if (dueDate !== undefined) {
      updateData.due_date = dueDate || null;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided to update'
      });
    }

    // 3) Perform update
    const [updated] = await db('tasks')
      .where({ id: taskId })
      .update(updateData)
      .returning([
        'id',
        'title',
        'description',
        'status',
        'priority',
        'assigned_to',
        'due_date',
        'updated_at'
      ]);

    // 4) Log in audit_logs
    await db('audit_logs').insert({
      tenant_id: tenantId,
      user_id: req.user.userId,
      action: 'TASK_UPDATED'
    });

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        status: updated.status,
        priority: updated.priority,
        assignedTo: updated.assigned_to,
        dueDate: updated.due_date,
        updatedAt: updated.updated_at
      }
    });
  } catch (err) {
    console.error('Error in updateTask:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
exports.deleteTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { tenantId } = req.user;

    // verify task belongs to tenant and project
    const task = await db('tasks')
      .where({ id: taskId, project_id: projectId })
      .first();

    if (!task || task.tenant_id !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await db('tasks')
      .where({ id: taskId })
      .del();

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteTask:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
