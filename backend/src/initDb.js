const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function initializeDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT now()
      );
    `);

    // Get list of executed migrations
    const { rows: executedMigrations } = await pool.query(
      'SELECT name FROM migrations ORDER BY id'
    );
    const executedMigrationNames = executedMigrations.map(m => m.name);

    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'sql', 'migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Ensures migrations run in order

    // Execute pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrationNames.includes(file)) {
        console.log(`Executing migration: ${file}`);
        const migrationPath = path.join(migrationsDir, file);
        const migrationSql = await fs.readFile(migrationPath, 'utf8');

        await pool.query('BEGIN');
        try {
          await pool.query(migrationSql);
          await pool.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [file]
          );
          await pool.query('COMMIT');
          console.log(`Migration ${file} completed successfully`);
        } catch (err) {
          await pool.query('ROLLBACK');
          throw err;
        }
      }
    }

    // Seed development data if needed
    if (process.env.NODE_ENV !== 'production') {
      const seedPath = path.join(__dirname, '..', 'sql', 'seed.sql');
      try {
        const seedSql = await fs.readFile(seedPath, 'utf8');
        await pool.query(seedSql);
        console.log('Development data seeded successfully');
      } catch (err) {
        if (err.code !== 'ENOENT') { // Ignore if seed file doesn't exist
          throw err;
        }
      }
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

module.exports = initializeDatabase;