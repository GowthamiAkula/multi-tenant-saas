// backend/knexfile.js

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'saasdb',
      user: process.env.DB_USER || 'saasuser',
      password: process.env.DB_PASSWORD || 'saaspass123',
    },
    migrations: {
      // migration files live in backend/migrations
      directory: './migrations',
    },
    seeds: {
      // seed files live in backend/seeds
      directory: './seeds',
    },
  },
};
