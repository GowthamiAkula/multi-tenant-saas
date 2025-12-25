require('dotenv').config();
const knex = require('knex');
const config = require('./knexfile')[process.env.NODE_ENV || 'development'];

const db = knex(config);

async function checkSeeds() {
  try {
    console.log('🔍 Checking seeds...\n');
    
    const users = await db('users').select('email', 'role', 'tenant_id', 'full_name').orderBy('role');
    console.log('👥 USERS:');
    users.forEach(u => console.log(`  ${u.role.padEnd(12)} | ${u.email} | tenant_id: ${u.tenant_id || 'NULL'}`));
    
    console.log('\n📊 COUNTS:');
    console.log('Users:', users.length);
    
  } catch (e) {
    console.log('❌ Seeds NOT run yet. Run: npx knex seed:run');
  } finally {
    await db.destroy();
  }
}

checkSeeds();
