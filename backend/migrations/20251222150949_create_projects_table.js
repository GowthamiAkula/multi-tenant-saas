/**
 * Migration: create projects table
 */

exports.up = function (knex) {
  return knex.schema.createTable('projects', function (table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Tenant relation
    table
      .uuid('tenant_id')
      .notNullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');

    // Creator relation
    table
      .uuid('created_by')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    // Fields
    table.string('name').notNullable();
    table.text('description');

    // Status enum: 'active', 'archived', 'completed'
    table
      .enu('status', ['active', 'archived', 'completed'], {
        useNative: true,
        enumName: 'project_status_enum',
      })
      .notNullable()
      .defaultTo('active');

    // Index on tenant_id
    table.index(['tenant_id'], 'idx_projects_tenant_id');

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
    .dropTableIfExists('projects')
    .raw('DROP TYPE IF EXISTS project_status_enum');
};
