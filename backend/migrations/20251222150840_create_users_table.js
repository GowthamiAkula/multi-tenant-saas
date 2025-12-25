/**
 * Migration: create users table
 */

exports.up = function (knex) {
  return knex.schema.createTable('users', function (table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Tenant relation
    table
      .uuid('tenant_id')
      .notNullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');

    // Basic fields
    table.string('email').notNullable();
    table.string('password_hash').notNullable();
    table.string('full_name').notNullable();

    // Role enum
    table
      .enu('role', ['super_admin', 'tenant_admin', 'user'], {
        useNative: true,
        enumName: 'user_role_enum',
      })
      .notNullable()
      .defaultTo('user');

    // Active flag
    table.boolean('is_active').notNullable().defaultTo(true);

    // Unique per-tenant email
    table.unique(['tenant_id', 'email']);

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
    .dropTableIfExists('users')
    .raw('DROP TYPE IF EXISTS user_role_enum');
};
