exports.seed = async function (knex) {
  // 1. Clear existing data in correct order (tasks -> projects -> users -> tenants)
  await knex('tasks').del();
  await knex('projects').del();
  await knex('users').del();
  await knex('tenants').del();

  // 1a. Insert super admin
  // password = Admin@123 (bcrypt hash)
  const [superAdmin] = await knex('users')
    .insert({
      tenant_id: null,
      email: 'superadmin@system.com',
      password_hash: '$2a$12$VzNtAOlqcQqvF7LQH0fr5eJYOvM3ZrQpo/0fbjC9tJRt8a9yACkRC', // Admin@123
      full_name: 'System Super Admin',
      role: 'super_admin',
      is_active: true,
    })
    .returning('*');

  // 2. Insert demo tenant
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

  // 3. Insert tenant admin for Demo Company
  const [tenantAdmin] = await knex('users')
    .insert({
      tenant_id: demoTenant.id,
      email: 'admin@demo.com',
      password_hash: '$2a$12$b85nrYUFAMFdpl95p.K0/uIFmXBK33ErtijbPyMh3bZL.GsAOQgY.', // Demo@123
      full_name: 'Demo Admin',
      role: 'tenant_admin',
      is_active: true,
    })
    .returning('*');

  // 4. Insert 2 regular users (password = User@123)
  const userPasswordHash =
    '$2b$12$tgVKscaAFm6MFnm1foyK8.QDD1UUfQoLrAjXIFrnGr2M.lGi7VXCW';

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

  // 5. Insert 2 sample projects for demo tenant
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

  // 6. Insert 5 sample tasks across the two projects
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
