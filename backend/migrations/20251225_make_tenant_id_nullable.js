/**
 * Migration: Allow NULL tenant_id for super admin (PostgreSQL raw SQL)
 */

exports.up = function (knex) {
  return knex.raw('ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL');
};

exports.down = function (knex) {
  return knex.raw('ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL');
};
