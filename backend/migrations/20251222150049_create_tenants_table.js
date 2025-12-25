/**
 * Migration: create tenants table
 */

exports.up = function (knex) {
  return knex.schema.createTable('tenants', function (table) {
    // Primary key as UUID
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Basic info
    table.string('name').notNullable();
    table.string('subdomain').notNullable().unique();

    // Status enum: 'active', 'suspended', 'trial'
    table
      .enu('status', ['active', 'suspended', 'trial'], {
        useNative: true,
        enumName: 'tenant_status_enum',
      })
      .notNullable()
      .defaultTo('trial');

    // Subscription plan enum: 'free', 'pro', 'enterprise'
    table
      .enu('subscription_plan', ['free', 'pro', 'enterprise'], {
        useNative: true,
        enumName: 'tenant_plan_enum',
      })
      .notNullable()
      .defaultTo('free');

    // Limits (defaults based on plan; can be updated by code later)
    table.integer('max_users').notNullable().defaultTo(5);
    table.integer('max_projects').notNullable().defaultTo(3);

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
    .dropTableIfExists('tenants')
    .raw('DROP TYPE IF EXISTS tenant_status_enum')
    .raw('DROP TYPE IF EXISTS tenant_plan_enum');
};
