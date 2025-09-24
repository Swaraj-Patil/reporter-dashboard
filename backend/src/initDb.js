const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function initializeDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Read schema.sql
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schemaSql);
    console.log('Database schema created successfully');

    // Read seed.sql if in development
    if (process.env.NODE_ENV !== 'production') {
      const seedPath = path.join(__dirname, '..', 'sql', 'seed.sql');
      const seedSql = await fs.readFile(seedPath, 'utf8');
      await pool.query(seedSql);
      console.log('Development data seeded successfully');
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

module.exports = initializeDatabase;