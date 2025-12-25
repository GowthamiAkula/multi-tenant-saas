/**
 * Migration: create tasks table
 */

exports.up = function (knex) {
  return knex.schema.createTable('tasks', function (table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Relations
    table
      .uuid('project_id')
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE');

    table
      .uuid('tenant_id')
      .notNullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');

    table
      .uuid('assigned_to')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');

    // Fields
    table.string('title').notNullable();
    table.text('description');

    // Status enum: 'todo', 'in_progress', 'completed'
    table
      .enu('status', ['todo', 'in_progress', 'completed'], {
        useNative: true,
        enumName: 'task_status_enum',
      })
      .notNullable()
      .defaultTo('todo');

    // Priority enum: 'low', 'medium', 'high'
    table
      .enu('priority', ['low', 'medium', 'high'], {
        useNative: true,
        enumName: 'task_priority_enum',
      })
      .notNullable()
      .defaultTo('medium');

    table.date('due_date').nullable();

    // Index on (tenant_id, project_id)
    table.index(['tenant_id', 'project_id'], 'idx_tasks_tenant_project');

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table
      .timestamp('updated_at')
      .notNullable()
      .defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('tasks')
    .raw('DROP TYPE IF EXISTS task_status_enum')
    .raw('DROP TYPE IF EXISTS task_priority_enum');
};
