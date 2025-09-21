const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { anonymizeText } = require('../utils/anonymize');

const router = express.Router();

// GET /tickets?anonymize=true
router.get('/', async (req, res) => {
  const anonymize = req.query.anonymize === 'true';
  try {
    const ticketsRes = await db.query(
      `SELECT id, external_id, title, description, anonymized_summary, status, source, created_at, updated_at
       FROM tickets
       ORDER BY created_at DESC
       LIMIT 200`
    );
    const rows = ticketsRes.rows.map((t) => {
      if (anonymize) {
        return {
          id: t.id,
          external_id: t.external_id,
          title: t.title,
          summary: t.anonymized_summary || anonymizeText(t.description),
          status: t.status,
          source: t.source,
          created_at: t.created_at,
          updated_at: t.updated_at
        };
      } else {
        return {
          id: t.id,
          external_id: t.external_id,
          title: t.title,
          description: t.description,
          summary: t.anonymized_summary || anonymizeText(t.description),
          status: t.status,
          source: t.source,
          created_at: t.created_at,
          updated_at: t.updated_at
        };
      }
    });
    res.json({ ok: true, tickets: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

// GET /tickets/:id
router.get('/:id', async (req, res) => {
  const anonymize = req.query.anonymize === 'true';
  const id = req.params.id;
  try {
    const t = await db.query(
      `SELECT id, external_id, title, description, anonymized_summary, status, source, created_at, updated_at
       FROM tickets WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (t.rowCount === 0) return res.status(404).json({ ok: false, error: 'not_found' });
    const ticket = t.rows[0];
    const comments = (await db.query(
      `SELECT id, author, body, created_at FROM comments WHERE ticket_id = $1 ORDER BY created_at ASC`,
      [ticket.id]
    )).rows;
    const impacts = (await db.query(
      `SELECT id, type, description, created_at FROM impact_events WHERE ticket_id = $1 ORDER BY created_at DESC`,
      [ticket.id]
    )).rows;
    if (anonymize) {
      ticket.description = undefined;
      ticket.summary = ticket.anonymized_summary || anonymizeText(ticket.description || '');
    } else {
      ticket.summary = ticket.anonymized_summary || anonymizeText(ticket.description || '');
    }
    res.json({ ok: true, ticket, comments, impacts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

// POST /tickets
// body: { title, description, source }
router.post('/', async (req, res) => {
  const { title, description, source } = req.body || {};
  if (!title || !description) return res.status(400).json({ ok: false, error: 'missing_fields' });

  try {
    const external_id = uuidv4();
    const anonymized_summary = anonymizeText(description);
    const insert = await db.query(
      `INSERT INTO tickets (external_id, title, description, anonymized_summary, status, source)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, external_id, title, status, created_at`,
      [external_id, title, description, anonymized_summary, 'received', source || 'web']
    );
    const ticket = insert.rows[0];

    // add an automated comment (simulation)
    await db.query(
      `INSERT INTO comments (ticket_id, author, body) VALUES ($1,$2,$3)`,
      [ticket.id, 'system', 'Thanks — your report has been received and will be reviewed.']
    );

    // return created ticket id + external_id for lookup
    res.status(201).json({ ok: true, ticket });

    // broadcast via socket if available (server will attach io)
    if (req.app.get('io')) {
      req.app.get('io').emit('ticket_created', { ticket: { id: ticket.id, title: ticket.title, status: ticket.status } });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'db_error' });
  }
});

module.exports = router;
