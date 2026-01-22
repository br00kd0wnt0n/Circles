import knex from 'knex';
import env from './env.js';

// Parse DATABASE_URL for knex config
function parseConnectionString(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port, 10),
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.slice(1), // Remove leading /
    // SSL configuration: secure by default, can be relaxed via env var for certain providers
    ssl: env.NODE_ENV === 'production'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false
  };
}

// Knex configuration
export const knexConfig = {
  client: 'pg',
  connection: parseConnectionString(env.DATABASE_URL),
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: '../migrations'
  },
  seeds: {
    directory: '../seeds'
  }
};

// Create knex instance
export const db = knex(knexConfig);

// Test connection
export async function testConnection() {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

export default db;
