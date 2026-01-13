import dotenv from 'dotenv';
dotenv.config();

// Parse DATABASE_URL
function parseConnectionString(url) {
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port, 10),
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
}

export default {
  development: {
    client: 'pg',
    connection: parseConnectionString(process.env.DATABASE_URL),
    pool: { min: 2, max: 10 },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  production: {
    client: 'pg',
    connection: parseConnectionString(process.env.DATABASE_URL),
    pool: { min: 2, max: 10 },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
};
