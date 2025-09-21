require('dotenv').config();
const db = require('./db');

async function run() {
  try {
    console.log('Creating tables (if not exists)...');
    const schema = `
    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      external_id TEXT UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      anonymized_summary TEXT,
      status TEXT NOT NULL DEFAULT 'received',
      source TEXT,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
      author TEXT,
      body TEXT,
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS impact_events (
      id SERIAL PRIMARY KEY,
      ticket_id INT REFERENCES tickets(id) ON DELETE SET NULL,
      type TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT now()
    );
    `;
    await db.query(schema);

    console.log('Inserting sample data...');
    // simple check: if tickets exist, skip
    const existing = await db.query('SELECT count(*) FROM tickets');
    if (parseInt(existing.rows[0].count, 10) > 0) {
      console.log('Tickets already present — skipping seed inserts.');
      process.exit(0);
    }

    const t1 = await db.query(
      `INSERT INTO tickets (external_id, title, description, anonymized_summary, status, source)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      ['t1', 'Ad targeting suspicious: "diet pills"', 'The ad targets young adults and includes a direct email contact john.doe@example.com proposing unsafe diet pills.', null, 'received', 'extension']
    );
    const id1 = t1.rows[0].id;
    await db.query(`INSERT INTO comments (ticket_id, author, body) VALUES ($1,$2,$3)`, [
      id1,
      'system',
      'Thanks — your report has been received and will be reviewed.'
    ]);

    const t2 = await db.query(
      `INSERT INTO tickets (external_id, title, description, anonymized_summary, status, source)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      ['t2', 'Misleading ad claiming guaranteed returns', 'Ad promises guaranteed returns and shows a phone +1-555-000-1234. Possible scam.', null, 'in_review', 'web']
    );
    const id2 = t2.rows[0].id;
    await db.query(`INSERT INTO comments (ticket_id, author, body) VALUES ($1,$2,$3)`, [
      id2,
      'reviewer',
      'Investigating financial claims. Gathering evidence.'
    ]);

    // add some impact events
    await db.query(`INSERT INTO impact_events (ticket_id, type, description) VALUES ($1,$2,$3)`, [
      id2,
      'in_review_log',
      'Review started for ads in the finance category.'
    ]);

    const t3 = await db.query(
      `INSERT INTO tickets (external_id, title, description, anonymized_summary, status, source)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      ['t3', 'Ad with hate speech', 'Ad contains derogatory language targeting a protected class.', null, 'responded', 'web']
    );
    const id3 = t3.rows[0].id;
    await db.query(`INSERT INTO comments (ticket_id, author, body) VALUES ($1,$2,$3)`, [
      id3,
      'reviewer',
      'Action: ad removed; advertiser warned.'
    ]);
    await db.query(`INSERT INTO impact_events (ticket_id, type, description) VALUES ($1,$2,$3)`, [
      id3,
      'ad_removed',
      'Ad removed from the platform as a result of policy violation.'
    ]);

    console.log('Seed complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
