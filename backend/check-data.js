require('dotenv').config();
const knex = require('knex');
const config = require('./knexfile')[process.env.NODE_ENV || 'development'];
const db = knex(config);

async function main() {
  const [tenants] = await db('tenants').count();
  const [users] = await db('users').count();
  const [projects] = await db('projects').count();
  const [tasks] = await db('tasks').count();

  console.log('Tenants:', tenants.count);
  console.log('Users:', users.count);
  console.log('Projects:', projects.count);
  console.log('Tasks:', tasks.count);

  await db.destroy();
}

main().catch(console.error);
