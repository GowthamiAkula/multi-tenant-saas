const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  // 1. Clear existing data in correct order
  await knex('tasks').del();
  await knex('projects').del();
  await knex('users').del();
  await knex('tenants').del();

  // ----------------------------
  // 1. Insert super admin
  // email: superadmin@system.com
  // password: Admin@123
  // ----------------------------
  const superAdminPasswordHash = await bcrypt.hash('Admin@123', 12);

  const [superAdmin] = await knex('users')
    .insert({
      tenant_id: null,
      email: 'superadmin@system.com',
      password_hash: superAdminPasswordHash,
      full_name: 'System Super Admin',
      role: 'super_admin',
      is_active: true,
    })
    .returning('*');

  // ----------------------------
  // 2. Insert demo tenant
  // ----------------------------
  const [demoTenant] = await knex('tenants')
    .insert({
      name: 'Demo Company',
      subdomain: 'demo',
      status: 'active',
      subscription_plan: 'pro',
      max_users: 25,
      max_projects: 15,
    })
    .returning('*');

  // ----------------------------
  // 3. Insert tenant admin
  // email: admin@demo.com
  // password: Demo@123
  // ----------------------------
  const tenantAdminPasswordHash = await bcrypt.hash('Demo@123', 12);

  const [tenantAdmin] = await knex('users')
    .insert({
      tenant_id: demoTenant.id,
      email: 'admin@demo.com',
      password_hash: tenantAdminPasswordHash,
      full_name: 'Demo Admin',
      role: 'tenant_admin',
      is_active: true,
    })
    .returning('*');

  // ----------------------------
  // 4. Insert regular users
  // password: User@123
  // ----------------------------
  const userPasswordHash = await bcrypt.hash('User@123', 12);

  const [user1] = await knex('users')
    .insert({
      tenant_id: demoTenant.id,
      email: 'user1@demo.com',
      password_hash: userPasswordHash,
      full_name: 'Demo User 1',
      role: 'user',
      is_active: true,
    })
    .returning('*');

  const [user2] = await knex('users')
    .insert({
      tenant_id: demoTenant.id,
      email: 'user2@demo.com',
      password_hash: userPasswordHash,
      full_name: 'Demo User 2',
      role: 'user',
      is_active: true,
    })
    .returning('*');

  // ----------------------------
  // 5. Insert demo projects
  // ----------------------------
  const [project1] = await knex('projects')
    .insert({
      tenant_id: demoTenant.id,
      name: 'Demo Project A',
      description: 'Sample project A for demo tenant',
      status: 'active',
      created_by: tenantAdmin.id,
    })
    .returning('*');

  const [project2] = await knex('projects')
    .insert({
      tenant_id: demoTenant.id,
      name: 'Demo Project B',
      description: 'Sample project B for demo tenant',
      status: 'active',
      created_by: tenantAdmin.id,
    })
    .returning('*');

  // ----------------------------
  // 6. Insert demo tasks
  // ----------------------------
  await knex('tasks').insert([
    {
      tenant_id: demoTenant.id,
      project_id: project1.id,
      title: 'Set up project repository',
      status: 'in_progress',
      priority: 'high',
      assigned_to: tenantAdmin.id,
    },
    {
      tenant_id: demoTenant.id,
      project_id: project1.id,
      title: 'Create database schema',
      status: 'todo',
      priority: 'high',
      assigned_to: user1.id,
    },
    {
      tenant_id: demoTenant.id,
      project_id: project1.id,
      title: 'Implement auth module',
      status: 'todo',
      priority: 'medium',
      assigned_to: user2.id,
    },
    {
      tenant_id: demoTenant.id,
      project_id: project2.id,
      title: 'Design UI mockups',
      status: 'in_progress',
      priority: 'medium',
      assigned_to: user1.id,
    },
    {
      tenant_id: demoTenant.id,
      project_id: project2.id,
      title: 'Prepare demo presentation',
      status: 'todo',
      priority: 'low',
      assigned_to: null,
    },
  ]);
};
