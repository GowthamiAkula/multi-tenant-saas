/**
 * Migration: create audit_logs table
 */

exports.up = function (knex) {
  return knex.schema.createTable('audit_logs', function (table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Tenant and user (user is nullable)
    table
      .uuid('tenant_id')
      .notNullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');

    table
      .uuid('user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');

    // Action details
    table.string('action').notNullable();        // e.g. CREATE_USER, DELETE_PROJECT
    table.string('entity_type');                // e.g. user, project, task
    table.string('entity_id');                  // id of the affected entity
    table.string('ip_address').nullable();

    // Timestamp
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('audit_logs');
};
