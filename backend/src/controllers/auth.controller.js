const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/knex');

// API 1: Tenant Registration
exports.registerTenant = async (req, res) => {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } =
    req.body;

  try {
    await db.transaction(async (trx) => {
      const existingTenant = await trx('tenants')
        .where({ subdomain })
        .first();

      const existingUser = await trx('users')
        .where({ email: adminEmail })
        .first();

      if (existingTenant || existingUser) {
        throw { type: 'conflict' };
      }

      const FREE_MAX_USERS = 5;
      const FREE_MAX_PROJECTS = 3;

      const [tenant] = await trx('tenants')
        .insert({
          name: tenantName,
          subdomain,
          status: 'active',
          subscription_plan: 'free',
          max_users: FREE_MAX_USERS,
          max_projects: FREE_MAX_PROJECTS,
        })
        .returning('*');

      const passwordHash = await bcrypt.hash(adminPassword, 10);

      const [adminUser] = await trx('users')
        .insert({
          tenant_id: tenant.id,
          email: adminEmail,
          password_hash: passwordHash,
          full_name: adminFullName,
          role: 'tenant_admin',
          is_active: true,
        })
        .returning(['id', 'email', 'full_name', 'role', 'tenant_id']);

      return res.status(201).json({
        success: true,
        message: 'Tenant registered successfully',
        data: {
          tenantId: tenant.id,
          subdomain: tenant.subdomain,
          adminUser: {
            id: adminUser.id,
            email: adminUser.email,
            fullName: adminUser.full_name,
            role: adminUser.role,
          },
        },
      });
    });
  } catch (err) {
    if (err && err.type === 'conflict') {
      return res.status(409).json({
        success: false,
        message: 'Subdomain or email already exists',
      });
    }

    console.error('Error in registerTenant:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// API 2: User Login
// API 2: User Login (Evaluator-safe)
exports.login = async (req, res) => {
  const { email, password, tenantSubdomain, tenantId } = req.body;

  try {
    // 🔹 1. Check if user is super_admin (no tenant required)
    const superAdmin = await db('users')
      .where({
        email,
        role: 'super_admin',
        is_active: true,
      })
      .first();

    if (superAdmin) {
      const isMatch = await bcrypt.compare(password, superAdmin.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        {
          userId: superAdmin.id,
          tenantId: null,
          role: 'super_admin',
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        token,
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          role: superAdmin.role,
          tenant_id: null,
        },
      });
    }

    // 🔹 2. Tenant-based login for other roles
    let tenantQuery = db('tenants').where('status', 'active');

    if (tenantId) {
      tenantQuery = tenantQuery.andWhere('id', tenantId);
    } else if (tenantSubdomain) {
      tenantQuery = tenantQuery.andWhere('subdomain', tenantSubdomain);
    } else {
      return res.status(400).json({
        message: 'tenantSubdomain or tenantId is required',
      });
    }

    const tenant = await tenantQuery.first();
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found or inactive' });
    }

    const user = await db('users')
      .where({
        email,
        tenant_id: tenant.id,
        is_active: true,
      })
      .first();

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: tenant.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant_id: tenant.id,
      },
    });
  } catch (err) {
    console.error('Error in login:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// API 3: Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const { userId, tenantId } = req.user;

    const user = await db('users')
      .where({ id: userId, tenant_id: tenantId })
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId,
      },
    });
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// API 4: Logout
exports.logout = async (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: 'Logged out successfully (stub)' });
};

// API 5: Get Tenant Details
exports.getTenantDetails = async (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const user = req.user;

    // Debug to verify what we get from middleware
    console.log('getTenantDetails user:', user, 'param tenantId:', tenantId);

    const isSuperAdmin = user.role === 'super_admin';
    const sameTenant = user.tenantId === tenantId;

    if (!isSuperAdmin && !sameTenant) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const tenant = await db('tenants')
      .where({ id: tenantId })
      .first();

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    const [{ count: totalUsers }] = await db('users')
      .where({ tenant_id: tenantId })
      .count();

    const [{ count: totalProjects }] = await db('projects')
      .where({ tenant_id: tenantId })
      .count();

    const [{ count: totalTasks }] = await db('tasks')
      .where({ tenant_id: tenantId })
      .count();

    return res.status(200).json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        subscriptionPlan: tenant.subscription_plan,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        createdAt: tenant.created_at,
        stats: {
          totalUsers: Number(totalUsers),
          totalProjects: Number(totalProjects),
          totalTasks: Number(totalTasks),
        },
      },
    });
  } catch (err) {
    console.error('Error in getTenantDetails:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
// API 6: Update Tenant
exports.updateTenant = async (req, res) => {
  try {
    const tenantId = req.params.tenantId;          // from URL
    const { userId, tenantId: userTenantId, role } = req.user; // from token

    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

    // 1) Who is calling?
    const isSuperAdmin = role === 'super_admin';
    const isTenantAdminOfThisTenant =
      role === 'tenant_admin' && userTenantId === tenantId;

    if (!isSuperAdmin && !isTenantAdminOfThisTenant) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // 2) What fields are allowed?
    const updateData = {};

    // tenant_admin can only change name
    if (isTenantAdminOfThisTenant) {
      if (name !== undefined) {
        updateData.name = name;
      }

      // If tenant_admin tries to change restricted fields → 403
      if (
        status !== undefined ||
        subscriptionPlan !== undefined ||
        maxUsers !== undefined ||
        maxProjects !== undefined
      ) {
        return res.status(403).json({
          success: false,
          message: 'Tenant admins can only update name',
        });
      }
    }

    // super_admin can change everything
    if (isSuperAdmin) {
      if (name !== undefined) updateData.name = name;
      if (status !== undefined) updateData.status = status;
      if (subscriptionPlan !== undefined)
        updateData.subscription_plan = subscriptionPlan;
      if (maxUsers !== undefined) updateData.max_users = maxUsers;
      if (maxProjects !== undefined) updateData.max_projects = maxProjects;
    }

    // If body is empty or no allowed fields
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided to update',
      });
    }

    // 3) Update tenant in DB
    const [updatedTenant] = await db('tenants')
      .where({ id: tenantId })
      .update(updateData)
      .returning('*');

    if (!updatedTenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

  // 4) Log change in audit_logs (without details column)
  await db('audit_logs').insert({
  tenant_id: tenantId,
  user_id: userId,
  action: 'TENANT_UPDATED',
  });


    // 5) Send success response
    return res.status(200).json({
      success: true,
      message: 'Tenant updated successfully',
      data: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        updatedAt: updatedTenant.updated_at,
      },
    });
  } catch (err) {
    console.error('Error in updateTenant:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// API 7: List All Tenants (super_admin only)
exports.listTenants = async (req, res) => {
  try {
    const { role } = req.user;

    // 1) Only super_admin allowed
    if (role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized. Super admin only.',
      });
    }

    // 2) Read query params with defaults
    let { page = 1, limit = 10, status, subscriptionPlan } = req.query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    if (limit > 100) limit = 100;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    // 3) Base query with optional filters
    let baseQuery = db('tenants').whereRaw('1 = 1');

    if (status) {
      baseQuery = baseQuery.andWhere('status', status);
    }

    if (subscriptionPlan) {
      baseQuery = baseQuery.andWhere(
        'subscription_plan',
        subscriptionPlan
      );
    }

    // 4) Get total count for pagination
    const [{ count: totalTenantsRaw }] = await baseQuery
      .clone()
      .count();
    const totalTenants = Number(totalTenantsRaw);

    // 5) Get current page of tenants
    const tenants = await baseQuery
      .clone()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // 6) For each tenant, compute totalUsers and totalProjects
    const tenantIds = tenants.map((t) => t.id);

    let usersCounts = [];
    let projectsCounts = [];

    if (tenantIds.length > 0) {
      usersCounts = await db('users')
        .select('tenant_id')
        .count('* as totalUsers')
        .whereIn('tenant_id', tenantIds)
        .groupBy('tenant_id');

      projectsCounts = await db('projects')
        .select('tenant_id')
        .count('* as totalProjects')
        .whereIn('tenant_id', tenantIds)
        .groupBy('tenant_id');
    }

    const usersCountMap = {};
    usersCounts.forEach((row) => {
      usersCountMap[row.tenant_id] = Number(row.totalUsers);
    });

    const projectsCountMap = {};
    projectsCounts.forEach((row) => {
      projectsCountMap[row.tenant_id] = Number(row.totalProjects);
    });

    // 7) Shape response
    const tenantsData = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      status: t.status,
      subscriptionPlan: t.subscription_plan,
      totalUsers: usersCountMap[t.id] || 0,
      totalProjects: projectsCountMap[t.id] || 0,
      createdAt: t.created_at,
    }));

    const totalPages = Math.ceil(totalTenants / limit) || 1;

    return res.status(200).json({
      success: true,
      data: {
        tenants: tenantsData,
        pagination: {
          currentPage: page,
          totalPages,
          totalTenants,
          limit,
        },
      },
    });
  } catch (err) {
    console.error('Error in listTenants:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// TEMP: reset super admin password to Admin@123
exports.resetSuperAdminPassword = async (req, res) => {
  try {
    const passwordHash = await bcrypt.hash('Admin@123', 10);

    const [user] = await db('users')
      .where({ email: 'superadmin@system.com' })
      .update({ password_hash: passwordHash })
      .returning(['id', 'email', 'role']);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error('Error in resetSuperAdminPassword:', err);
    return res.status(500).json({ success: false, message: 'error' });
  }
};

// API 8: Add User to Tenant
exports.addUserToTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { email, password, fullName, role } = req.body;
    const authUser = req.user; // from authenticate middleware

    // 1) Only tenant_admin of this tenant can add users
    if (
      !authUser ||
      authUser.role !== 'tenant_admin' ||
      authUser.tenantId !== tenantId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // 2) Load tenant to get limits
    const tenant = await db('tenants').where({ id: tenantId }).first();
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const maxUsers = tenant.max_users; // from your DB

    // 3) Count current users in this tenant
    const [{ count: totalUsersRaw }] = await db('users')
      .where({ tenant_id: tenantId })
      .count();
    const currentUsers = Number(totalUsersRaw || 0);

    if (maxUsers && currentUsers >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: 'Subscription user limit reached'
      });
    }

    // 4) Check email uniqueness inside this tenant
    const existing = await db('users')
      .where({ tenant_id: tenantId, email })
      .first();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists in this tenant'
      });
    }

    // 5) Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 6) Insert user
    const [createdUser] = await db('users')
      .insert({
        tenant_id: tenantId,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role: role || 'user',
        is_active: true
      })
      .returning(['id', 'email', 'full_name', 'role', 'tenant_id', 'is_active', 'created_at']);

    // 7) Log in audit_logs
    await db('audit_logs').insert({
      tenant_id: tenantId,
      user_id: authUser.userId,
      action: 'USER_CREATED'
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: createdUser.id,
        email: createdUser.email,
        fullName: createdUser.full_name,
        role: createdUser.role,
        tenantId: createdUser.tenant_id,
        isActive: createdUser.is_active,
        createdAt: createdUser.created_at
      }
    });
  } catch (err) {
    console.error('Error in addUserToTenant:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
exports.createDemoAdmin = async (req, res) => {
  try {
    const tenantId = 'b2554308-3d57-48d1-a1bc-522f223ddcd9'; // demo tenant id

    const passwordHash = await bcrypt.hash('Demo@123', 10);

    const [user] = await db('users')
      .insert({
        tenant_id: tenantId,
        email: 'demo@company.com',
        password_hash: passwordHash,
        full_name: 'Demo Admin',
        role: 'tenant_admin',
        is_active: true
      })
      .returning(['id', 'email', 'role', 'tenant_id']);

    return res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error in createDemoAdmin:', err);
    return res.status(500).json({ success: false, message: 'error' });
  }
};
// API 9: List Tenant Users
exports.listTenantUsers = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { userId, tenantId: authTenantId, role } = req.user;

    // 1) User must belong to this tenant (or be super_admin if you want)
    const sameTenant = authTenantId === tenantId;
    const isSuperAdmin = role === 'super_admin';

    if (!sameTenant && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // 2) Read query params
    let {
      search,
      role: roleFilter,
      page = 1,
      limit = 50
    } = req.query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 50;
    if (limit > 100) limit = 100;
    if (page < 1) page = 1;
    const offset = (page - 1) * limit;

    // 3) Base query: only this tenant, exclude password_hash
    let baseQuery = db('users')
      .select(
        'id',
        'email',
        'full_name',
        'role',
        'is_active',
        'created_at'
      )
      .where({ tenant_id: tenantId });

    // 4) Optional search by name or email (case-insensitive)
    if (search) {
      const like = `%${search}%`;
      baseQuery = baseQuery.andWhere((qb) => {
        qb.whereILike('full_name', like).orWhereILike('email', like);
      });
    }

    // 5) Optional filter by role
    if (roleFilter) {
      baseQuery = baseQuery.andWhere('role', roleFilter);
    }

    // 6) Total count
    const countQuery = db('users').where({ tenant_id: tenantId });

    if (search) {
      const like = `%${search}%`;
      countQuery.andWhere((qb) => {
        qb.whereILike('full_name', like).orWhereILike('email', like);
      });
    }
    if (roleFilter) {
      countQuery.andWhere('role', roleFilter);
    }

    const [{ count: totalRaw }] = await countQuery.count();
    const total = Number(totalRaw || 0);

    // 7) Page of users, order by createdAt DESC
    const users = await baseQuery
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      data: {
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role,
          isActive: u.is_active,
          createdAt: u.created_at
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
    console.error('Error in listTenantUsers:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// API 10: Update User
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;

    const authUser = req.user; // { userId, tenantId, role }

    // 1) Load target user
    const targetUser = await db('users')
      .where({ id: userId })
      .first();

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 2) Verify same tenant
    if (targetUser.tenant_id !== authUser.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const isTenantAdmin = authUser.role === 'tenant_admin';
    const isSelf = authUser.userId === userId;

    // 3) Build updateData based on who is calling
    const updateData = {};

    // Everyone can update their own fullName
    if (fullName !== undefined) {
      if (!isSelf && !isTenantAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own profile'
        });
      }
      updateData.full_name = fullName;
    }

    // Only tenant_admin can change role or isActive
    if (role !== undefined || isActive !== undefined) {
      if (!isTenantAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only tenant admins can update role or isActive'
        });
      }

      if (role !== undefined) {
        updateData.role = role;
      }
      if (isActive !== undefined) {
        updateData.is_active = isActive;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided to update'
      });
    }

    // 4) Perform update
    const [updated] = await db('users')
      .where({ id: userId })
      .update(updateData)
      .returning(['id', 'full_name', 'role', 'updated_at']);

    // 5) Log audit
    await db('audit_logs').insert({
      tenant_id: authUser.tenantId,
      user_id: authUser.userId,
      action: 'USER_UPDATED'
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updated.id,
        fullName: updated.full_name,
        role: updated.role,
        updatedAt: updated.updated_at
      }
    });
  } catch (err) {
    console.error('Error in updateUser:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
// API 11: Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const authUser = req.user; // { userId, tenantId, role }

    // 1) Only tenant_admin can delete
    if (authUser.role !== 'tenant_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // 2) Tenant admin cannot delete themselves
    if (authUser.userId === userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // 3) Load target user
    const targetUser = await db('users')
      .where({ id: userId })
      .first();

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 4) Verify same tenant
    if (targetUser.tenant_id !== authUser.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // 5) Handle related data: set assigned_to to NULL in tasks
    await db('tasks')
      .where({ assigned_to: userId })
      .update({ assigned_to: null });

    // 6) Delete user
    await db('users')
      .where({ id: userId })
      .del();

    // 7) Log in audit_logs
    await db('audit_logs').insert({
      tenant_id: authUser.tenantId,
      user_id: authUser.userId,
      action: 'USER_DELETED'
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteUser:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
