// knexfile.js  (in project root: multi-tenant-saas/knexfile.js)

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'localhost',     // Postgres container exposed on localhost
      port: 5433,            // from docker-compose ports: "5433:5432"
      database: 'saasdb',
      user: 'saasuser',
      password: 'saaspass123'
    },
    migrations: {
      // your migration files are in: backend/migrations
      directory: './backend/migrations'
    },
    seeds: {
      // your seeds folder is: backend/seeds
      directory: './backend/seeds'
    }
  }
};
