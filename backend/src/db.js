const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("FATAL: DATABASE_URL not set");
  process.exit(1);
}

const pool = new Pool({ connectionString });

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
